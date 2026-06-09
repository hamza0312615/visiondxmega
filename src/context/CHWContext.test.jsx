import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CHWProvider, useCHW } from './CHWContext';
import * as useCHWSessionHook from '../hooks/useCHWSession';

// Mock the useCHWSession hook
vi.mock('../hooks/useCHWSession', () => ({
  useCHWSession: vi.fn()
}));

// Test Consumer component to access context
const TestConsumer = () => {
  const { session, activePatientId, setActivePatientId, startSession } = useCHW();
  return (
    <div>
      <div data-testid="session">{session ? 'Active' : 'None'}</div>
      <div data-testid="activePatientId">{activePatientId || 'None'}</div>
      <button onClick={() => setActivePatientId('patient-123')} data-testid="set-patient-btn">
        Set Patient
      </button>
      <button onClick={() => startSession({ name: 'Worker' })} data-testid="start-session-btn">
        Start Session
      </button>
    </div>
  );
};

// Component that uses useCHW outside of provider to test error throwing
const ImproperConsumer = () => {
  useCHW();
  return <div>Improper</div>;
};

describe('CHWContext', () => {
  const mockCHWSession = {
    session: null,
    startSession: vi.fn(),
    endSession: vi.fn(),
    addPatient: vi.fn(),
    updatePatientResult: vi.fn(),
    getPatientById: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useCHWSessionHook.useCHWSession.mockReturnValue(mockCHWSession);
  });

  it('provides CHW session values to children', () => {
    render(
      <CHWProvider>
        <TestConsumer />
      </CHWProvider>
    );

    expect(screen.getByTestId('session')).toHaveTextContent('None');
    expect(screen.getByTestId('activePatientId')).toHaveTextContent('None');
  });

  it('allows updating activePatientId', () => {
    render(
      <CHWProvider>
        <TestConsumer />
      </CHWProvider>
    );

    const button = screen.getByTestId('set-patient-btn');
    act(() => {
      button.click();
    });

    expect(screen.getByTestId('activePatientId')).toHaveTextContent('patient-123');
  });

  it('forwards calls to chwSession methods', () => {
    render(
      <CHWProvider>
        <TestConsumer />
      </CHWProvider>
    );

    const button = screen.getByTestId('start-session-btn');
    act(() => {
      button.click();
    });

    expect(mockCHWSession.startSession).toHaveBeenCalledWith({ name: 'Worker' });
  });

  it('throws error when useCHW is used outside of CHWProvider', () => {
    // Prevent console.error from cluttering test output for expected error
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<ImproperConsumer />)).toThrow('useCHW must be used within a CHWProvider');

    spy.mockRestore();
  });

  it('updates when useCHWSession state changes', () => {
    const { rerender } = render(
      <CHWProvider>
        <TestConsumer />
      </CHWProvider>
    );

    expect(screen.getByTestId('session')).toHaveTextContent('None');

    // Simulate session starting
    useCHWSessionHook.useCHWSession.mockReturnValue({
      ...mockCHWSession,
      session: { worker: { name: 'Worker' } }
    });

    rerender(
      <CHWProvider>
        <TestConsumer />
      </CHWProvider>
    );

    expect(screen.getByTestId('session')).toHaveTextContent('Active');
  });
});
