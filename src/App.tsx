import { useEffect } from 'react';
import { useStore, type Screen } from './store/useStore';
import { Dashboard } from './screens/Dashboard';
import { IncomeScreen } from './screens/Income';
import { ExpensesScreen } from './screens/Expenses';
import { TaxesScreen } from './screens/Taxes';
import { FacturasScreen } from './screens/Facturas';
import { ImportarScreen } from './screens/Importar';
import { ProfileScreen } from './screens/Profile';
import { SettingsScreen } from './screens/Settings';
import { Onboarding } from './screens/Onboarding';
import { Disclaimer } from './components/Disclaimer';
import { cx } from './components/ui';

const NAV: { id: Screen; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Resumen', icon: '◈' },
  { id: 'income', label: 'Ingresos', icon: '↑' },
  { id: 'expenses', label: 'Gastos', icon: '↓' },
  { id: 'taxes', label: 'Impuestos', icon: '§' },
  { id: 'facturas', label: 'Facturas', icon: '▦' },
  { id: 'importar', label: 'Lector', icon: '⤓' },
  { id: 'profile', label: 'Año y perfil', icon: '⚙' },
  { id: 'settings', label: 'Datos', icon: '↻' },
];

export function App() {
  const loaded = useStore((s) => s.loaded);
  const load = useStore((s) => s.load);
  const onboardingDone = useStore((s) => s.onboardingDone);
  const screen = useStore((s) => s.screen);
  const setScreen = useStore((s) => s.setScreen);
  const activeYear = useStore((s) => s.activeYear);

  useEffect(() => {
    void load();
  }, [load]);

  if (!loaded) {
    return (
      <div className="grid min-h-screen place-items-center text-muted">Cargando…</div>
    );
  }

  if (!onboardingDone) {
    return <Onboarding />;
  }

  return (
    <div className="min-h-screen pb-24 md:pb-0">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent font-mono text-accent-ink">
              €
            </span>
            <div className="leading-tight">
              <div className="text-sm font-semibold">Calculadora Autónomos</div>
              <div className="text-xs text-muted">Ejercicio {activeYear}</div>
            </div>
          </div>
          {/* Desktop nav */}
          <nav className="hidden gap-1 md:flex">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => setScreen(n.id)}
                className={cx(
                  'rounded-lg px-3 py-1.5 text-sm font-medium transition',
                  screen === n.id
                    ? 'bg-accent-soft text-accent'
                    : 'text-muted hover:bg-surface-2 hover:text-ink',
                )}
              >
                {n.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {screen === 'dashboard' && <Dashboard />}
        {screen === 'income' && <IncomeScreen />}
        {screen === 'expenses' && <ExpensesScreen />}
        {screen === 'taxes' && <TaxesScreen />}
        {screen === 'facturas' && <FacturasScreen />}
        {screen === 'importar' && <ImportarScreen />}
        {screen === 'profile' && <ProfileScreen />}
        {screen === 'settings' && <SettingsScreen />}
        <Disclaimer />
      </main>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-10 flex overflow-x-auto border-t border-border bg-surface/95 backdrop-blur md:hidden">
        {NAV.map((n) => (
          <button
            key={n.id}
            onClick={() => setScreen(n.id)}
            className={cx(
              'flex min-w-[4.25rem] flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium',
              screen === n.id ? 'text-accent' : 'text-muted',
            )}
          >
            <span className="text-base leading-none">{n.icon}</span>
            {n.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
