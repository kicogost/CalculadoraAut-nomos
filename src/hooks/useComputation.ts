import { useMemo } from 'react';
import { useStore, useActiveProfile } from '../store/useStore';
import {
  computeYear,
  monthlySetAside,
  getTaxConfig,
  TAX_CONFIG_2026,
  type YearComputation,
  type SetAsideBreakdown,
} from '../engine';

/** Invoices/expenses filtered to the active year is not needed: the engine filters by year. */
export function useComputation(throughMonth = 12): {
  comp: YearComputation;
  setAside: (asOfMonth: number) => SetAsideBreakdown;
} {
  const invoices = useStore((s) => s.invoices);
  const expenses = useStore((s) => s.expenses);
  const provisioning = useStore((s) => s.provisioning);
  const profile = useActiveProfile();
  const cfg = getTaxConfig(profile.year) ?? TAX_CONFIG_2026;

  return useMemo(() => {
    const comp = computeYear(invoices, expenses, profile, cfg, throughMonth);
    const setAside = (asOfMonth: number) =>
      monthlySetAside(invoices, expenses, profile, cfg, asOfMonth, provisioning);
    return { comp, setAside };
  }, [invoices, expenses, profile, cfg, throughMonth, provisioning]);
}
