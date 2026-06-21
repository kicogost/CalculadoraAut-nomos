import Dexie, { type Table } from 'dexie';
import type { Expense, Invoice, ProvisioningSettings, YearProfile } from '../engine/types';

/** App-wide settings stored as a single row (id = 'app'). */
export interface AppSettings {
  id: 'app';
  activeYear: number;
  onboardingDone: boolean;
  provisioning: ProvisioningSettings;
}

/**
 * Local-first IndexedDB store. Everything stays in the browser — no backend, no
 * login. Multi-year data lives side by side; the active year is in AppSettings.
 */
export class AutonomosDB extends Dexie {
  invoices!: Table<Invoice, string>;
  expenses!: Table<Expense, string>;
  profiles!: Table<YearProfile, number>; // keyed by year
  settings!: Table<AppSettings, string>;

  constructor() {
    super('calculadora-autonomos');
    this.version(1).stores({
      invoices: 'id, date, paidDate, placeOfSupply',
      expenses: 'id, date, category',
      profiles: 'year',
      settings: 'id',
    });
  }
}

export const db = new AutonomosDB();

export const DEFAULT_PROVISIONING: ProvisioningSettings = { style: 'exact' };
