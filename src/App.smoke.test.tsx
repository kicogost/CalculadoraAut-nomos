// @vitest-environment jsdom
import 'fake-indexeddb/auto';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor, fireEvent } from '@testing-library/react';
import { App } from './App';

afterEach(cleanup);

describe('App smoke test (mounts without crashing)', () => {
  it('shows onboarding on first run', async () => {
    render(<App />);
    // Onboarding welcome step renders after the store loads.
    await waitFor(() => expect(screen.getByText('Bienvenido/a')).toBeTruthy());
  });

  it('can walk through onboarding to the dashboard', async () => {
    render(<App />);
    await waitFor(() => expect(screen.getByText('Bienvenido/a')).toBeTruthy());

    // Click "Empezar" then advance through the wizard.
    fireEvent.click(screen.getByText('Empezar'));
    await waitFor(() => screen.getByText(/Qué ejercicio/));
    fireEvent.click(screen.getByText('Siguiente')); // year
    await waitFor(() => screen.getByText(/residencia fiscal/));
    fireEvent.click(screen.getByText('Siguiente')); // comunidad
    await waitFor(() => screen.getByText(/Estás en tus primeros/));
    fireEvent.click(screen.getByText('Siguiente')); // first years
    await waitFor(() => screen.getByText(/A quién facturas/));
    fireEvent.click(screen.getByText('Siguiente')); // persona
    await waitFor(() => screen.getByText('Todo listo'));
    fireEvent.click(screen.getByText('Ir al resumen')); // finish

    // Dashboard hero should appear.
    await waitFor(() => expect(screen.getByText(/Aparta este mes/)).toBeTruthy());
  });
});
