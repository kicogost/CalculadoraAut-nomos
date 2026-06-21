import { create } from 'zustand';
import { db, DEFAULT_PROVISIONING, type AppSettings } from '../db/db';
import { newId } from '../db/repo';
import type {
  Expense,
  Invoice,
  ProvisioningSettings,
  YearProfile,
} from '../engine/types';
import type { Factura, IssuerProfile } from '../types/factura';
import { EMPTY_ISSUER } from '../types/factura';
import { facturaToInvoiceFields } from '../lib/factura';
import type { DraftEntry } from '../types/reader';

export type Screen =
  | 'dashboard'
  | 'income'
  | 'expenses'
  | 'taxes'
  | 'facturas'
  | 'importar'
  | 'profile'
  | 'settings';

export function defaultProfile(year: number): YearProfile {
  return {
    year,
    comunidadAutonoma: 'madrid',
    ssStatus: { kind: 'tarifa_plana_y1' },
    recognitionBasis: 'devengo',
    estimacionDirecta: 'simplificada',
    personal: {
      children: 0,
      childrenUnder3: 0,
      over65: false,
      over75: false,
      disabilityPct: 0,
    },
  };
}

interface StoreState {
  loaded: boolean;
  invoices: Invoice[];
  expenses: Expense[];
  facturas: Factura[];
  issuer: IssuerProfile;
  profiles: Record<number, YearProfile>;
  activeYear: number;
  provisioning: ProvisioningSettings;
  onboardingDone: boolean;
  screen: Screen;

  load: () => Promise<void>;
  setScreen: (s: Screen) => void;

  addInvoice: (inv: Omit<Invoice, 'id'>) => Promise<void>;
  updateInvoice: (inv: Invoice) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;

  addExpense: (exp: Omit<Expense, 'id'>) => Promise<void>;
  updateExpense: (exp: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;

  /** Commit reviewed draft entries (from CSV/AI readers) as invoices/expenses. */
  importDrafts: (drafts: DraftEntry[]) => Promise<{ income: number; expenses: number }>;

  upsertProfile: (profile: YearProfile) => Promise<void>;
  setActiveYear: (year: number) => Promise<void>;
  setProvisioning: (p: ProvisioningSettings) => Promise<void>;
  completeOnboarding: (profile: YearProfile) => Promise<void>;

  setIssuer: (issuer: IssuerProfile) => Promise<void>;
  saveFactura: (factura: Factura) => Promise<void>;
  deleteFactura: (id: string) => Promise<void>;
  /** Create/refresh the linked income Invoice from a factura (feeds the calculator). */
  addFacturaToIncome: (factura: Factura) => Promise<void>;
  removeFacturaFromIncome: (factura: Factura) => Promise<void>;

  refreshAfterImport: () => Promise<void>;
}

const SETTINGS_DEFAULT: AppSettings = {
  id: 'app',
  activeYear: 2026,
  onboardingDone: false,
  provisioning: DEFAULT_PROVISIONING,
};

async function persistSettings(partial: Partial<AppSettings>): Promise<void> {
  const current = (await db.settings.get('app')) ?? SETTINGS_DEFAULT;
  await db.settings.put({ ...current, ...partial, id: 'app' });
}

export const useStore = create<StoreState>((set, get) => ({
  loaded: false,
  invoices: [],
  expenses: [],
  facturas: [],
  issuer: EMPTY_ISSUER,
  profiles: {},
  activeYear: 2026,
  provisioning: DEFAULT_PROVISIONING,
  onboardingDone: false,
  screen: 'dashboard',

  async load() {
    const [invoices, expenses, profileList, settings, facturas] = await Promise.all([
      db.invoices.toArray(),
      db.expenses.toArray(),
      db.profiles.toArray(),
      db.settings.get('app'),
      db.facturas.toArray(),
    ]);
    const profiles: Record<number, YearProfile> = {};
    for (const p of profileList) profiles[p.year] = p;
    const s = settings ?? SETTINGS_DEFAULT;
    set({
      loaded: true,
      invoices,
      expenses,
      facturas,
      issuer: s.issuer ?? EMPTY_ISSUER,
      profiles,
      activeYear: s.activeYear,
      provisioning: s.provisioning ?? DEFAULT_PROVISIONING,
      onboardingDone: s.onboardingDone,
    });
  },

  setScreen: (screen) => set({ screen }),

  async addInvoice(inv) {
    const full: Invoice = { ...inv, id: newId() };
    await db.invoices.add(full);
    set({ invoices: [...get().invoices, full] });
  },
  async updateInvoice(inv) {
    await db.invoices.put(inv);
    set({ invoices: get().invoices.map((i) => (i.id === inv.id ? inv : i)) });
  },
  async deleteInvoice(id) {
    await db.invoices.delete(id);
    set({ invoices: get().invoices.filter((i) => i.id !== id) });
  },

  async addExpense(exp) {
    const full: Expense = { ...exp, id: newId() };
    await db.expenses.add(full);
    set({ expenses: [...get().expenses, full] });
  },
  async updateExpense(exp) {
    await db.expenses.put(exp);
    set({ expenses: get().expenses.map((e) => (e.id === exp.id ? exp : e)) });
  },
  async deleteExpense(id) {
    await db.expenses.delete(id);
    set({ expenses: get().expenses.filter((e) => e.id !== id) });
  },

  async importDrafts(drafts) {
    const included = drafts.filter((d) => d.include);
    const newInvoices: Invoice[] = [];
    const newExpenses: Expense[] = [];
    for (const d of included) {
      if (d.kind === 'income') {
        newInvoices.push({
          id: newId(),
          date: d.date,
          clientName: d.description || 'Cliente',
          amountCents: d.amountCents,
          placeOfSupply: d.placeOfSupply ?? 'domestic_es',
          ivaRate: d.ivaRate ?? 0,
          retencionRate: d.retencionRate ?? 0,
          notes: 'Importado',
        });
      } else {
        newExpenses.push({
          id: newId(),
          date: d.date,
          category: d.category || 'Otros',
          amountCents: d.amountCents,
          deductiblePct: d.deductiblePct ?? 100,
          inputIvaCents: d.inputIvaCents ?? 0,
          notes: 'Importado',
        });
      }
    }
    if (newInvoices.length) await db.invoices.bulkAdd(newInvoices);
    if (newExpenses.length) await db.expenses.bulkAdd(newExpenses);
    set({
      invoices: [...get().invoices, ...newInvoices],
      expenses: [...get().expenses, ...newExpenses],
    });
    return { income: newInvoices.length, expenses: newExpenses.length };
  },

  async upsertProfile(profile) {
    await db.profiles.put(profile);
    set({ profiles: { ...get().profiles, [profile.year]: profile } });
  },

  async setActiveYear(year) {
    if (!get().profiles[year]) {
      const p = defaultProfile(year);
      await db.profiles.put(p);
      set({ profiles: { ...get().profiles, [year]: p } });
    }
    await persistSettings({ activeYear: year });
    set({ activeYear: year });
  },

  async setProvisioning(provisioning) {
    await persistSettings({ provisioning });
    set({ provisioning });
  },

  async completeOnboarding(profile) {
    await db.profiles.put(profile);
    await persistSettings({ onboardingDone: true, activeYear: profile.year });
    set({
      profiles: { ...get().profiles, [profile.year]: profile },
      onboardingDone: true,
      activeYear: profile.year,
      screen: 'dashboard',
    });
  },

  async setIssuer(issuer) {
    await persistSettings({ issuer });
    set({ issuer });
  },

  async saveFactura(factura) {
    await db.facturas.put(factura);
    const exists = get().facturas.some((f) => f.id === factura.id);
    set({
      facturas: exists
        ? get().facturas.map((f) => (f.id === factura.id ? factura : f))
        : [...get().facturas, factura],
    });
    // Keep a linked income Invoice in sync if there is one.
    if (factura.linkedInvoiceId) {
      const fields = facturaToInvoiceFields(factura);
      const inv: Invoice = { ...fields, id: factura.linkedInvoiceId };
      await db.invoices.put(inv);
      set({
        invoices: get().invoices.map((i) => (i.id === inv.id ? inv : i)),
      });
    }
  },

  async deleteFactura(id) {
    await db.facturas.delete(id);
    set({ facturas: get().facturas.filter((f) => f.id !== id) });
  },

  async addFacturaToIncome(factura) {
    const invoiceId = factura.linkedInvoiceId ?? newId();
    const inv: Invoice = { ...facturaToInvoiceFields(factura), id: invoiceId };
    await db.invoices.put(inv);
    const linked = { ...factura, linkedInvoiceId: invoiceId };
    await db.facturas.put(linked);
    set({
      invoices: get().invoices.some((i) => i.id === invoiceId)
        ? get().invoices.map((i) => (i.id === invoiceId ? inv : i))
        : [...get().invoices, inv],
      facturas: get().facturas.map((f) => (f.id === factura.id ? linked : f)),
    });
  },

  async removeFacturaFromIncome(factura) {
    if (!factura.linkedInvoiceId) return;
    await db.invoices.delete(factura.linkedInvoiceId);
    const unlinked = { ...factura, linkedInvoiceId: undefined };
    await db.facturas.put(unlinked);
    set({
      invoices: get().invoices.filter((i) => i.id !== factura.linkedInvoiceId),
      facturas: get().facturas.map((f) => (f.id === factura.id ? unlinked : f)),
    });
  },

  async refreshAfterImport() {
    await get().load();
  },
}));

/** The profile for the active year, creating a default in-memory if missing. */
export function useActiveProfile(): YearProfile {
  return useStore((s) => s.profiles[s.activeYear] ?? defaultProfile(s.activeYear));
}
