import { useEffect, useState } from 'react';
import { centsToEur, eurToCents } from '../engine';
import { TextInput } from './ui';

/** Euro input that reads/writes integer cents. Accepts comma or dot decimals. */
export function MoneyInput({
  valueCents,
  onChange,
  placeholder = '0,00',
}: {
  valueCents: number;
  onChange: (cents: number) => void;
  placeholder?: string;
}) {
  const [text, setText] = useState(() => (valueCents ? String(centsToEur(valueCents)) : ''));

  // Keep the field in sync when the external value changes (e.g. form reset).
  useEffect(() => {
    setText(valueCents ? String(centsToEur(valueCents)) : '');
  }, [valueCents]);

  return (
    <TextInput
      inputMode="decimal"
      placeholder={placeholder}
      className="tnum text-right"
      value={text}
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        // Spanish style "1.234,56": dots are thousands separators, comma is decimal.
        // If there's no comma, treat a dot as the decimal separator ("1234.56").
        const normalized = raw.includes(',')
          ? raw.replace(/\./g, '').replace(',', '.')
          : raw;
        const num = Number(normalized);
        onChange(Number.isFinite(num) ? eurToCents(num) : 0);
      }}
    />
  );
}
