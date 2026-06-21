import { create } from 'zustand';
import { db, DEFAULT_PROVISIONING, type AppSettings } from '../db/db';
import { newId } from '../db/repo';
import type {
  Expense,
  Invoice,
  ProvisioningSettings,
  YearProfile,
} from '../engine/types';

export type Screen =
  | 'dashboard'
  | 'income'
  | 'expenses'
  | 'taxes'
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

  upsertProfile: (profile: YearProfile) => Promise<void>;
  setActiveYear: (year: number) => Promise<void>;
  setProvisioning: (p: ProvisioningSettings) => Promise<void>;
  completeOnboarding: (profile: YearProfile) => Promise<void>;

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
  profiles: {},
  activeYear: 2026,
  provisioning: DEFAULT_PROVISIONING,
  onboardingDone: false,
  screen: 'dashboard',

  async load() {
    const [invoices, expenses, profileList, settings] = await Promise.all([
      db.invoices.toArray(),
      db.expenses.toArray(),
      db.profiles.toArray(),
      db.settings.get('app'),
    ]);
    const profiles: Record<number, YearProfile> = {};
    for (const p of profileList) profiles[p.year] = p;
    const s = settings ?? SETTINGS_DEFAULT;
    set({
      loaded: true,
      invoices,
      expenses,
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

  async refreshAfterImport() {
    await get().load();
  },
}));

/** The profile for the active year, creating a default in-memory if missing. */
export function useActiveProfile(): YearProfile {
  return useStore((s) => s.profiles[s.activeYear] ?? defaultProfile(s.activeYear));
}
