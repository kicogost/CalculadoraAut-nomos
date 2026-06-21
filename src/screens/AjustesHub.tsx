import { useState } from 'react';
import { ProfileScreen } from './Profile';
import { SettingsScreen } from './Settings';
import { cx } from '../components/ui';

type Tab = 'perfil' | 'datos';

/** Settings hub: año y perfil + datos, folded into one tab. */
export function AjustesHub() {
  const [tab, setTab] = useState<Tab>('perfil');
  return (
    <div className="space-y-5">
      <div className="inline-flex rounded-xl bg-surface-2 p-1">
        <Seg active={tab === 'perfil'} onClick={() => setTab('perfil')}>Año y perfil</Seg>
        <Seg active={tab === 'datos'} onClick={() => setTab('datos')}>Datos</Seg>
      </div>
      {tab === 'perfil' ? <ProfileScreen /> : <SettingsScreen />}
    </div>
  );
}

function Seg({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'rounded-lg px-4 py-1.5 text-sm font-medium transition',
        active ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink',
      )}
    >
      {children}
    </button>
  );
}
