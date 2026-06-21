import { renderHook, act } from '@testing-library/react';
import { useCHWSession } from './useCHWSession';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('useCHWSession', () => {
  const SESSION_KEY = 'visiondx_chw_session';
  const RESULTS_KEY = 'visiondx_chw_results';

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('should initialize with null session if nothing in localStorage', () => {
    const { result } = renderHook(() => useCHWSession());
    expect(result.current.session).toBeNull();
  });

  it('should initialize with session from localStorage if present', () => {
    const mockSession = {
      worker: { name: 'Test Worker' },
      sessionStart: new Date().toISOString(),
      patients: []
    };
    localStorage.getItem.mockReturnValueOnce(JSON.stringify(mockSession));

    const { result } = renderHook(() => useCHWSession());
    expect(result.current.session).toEqual(mockSession);
  });

  it('should start a new session', () => {
    const { result } = renderHook(() => useCHWSession());
    const workerData = { name: 'CHW Worker 1', location: 'Village A' };

    act(() => {
      result.current.startSession(workerData);
    });

    expect(result.current.session).not.toBeNull();
    expect(result.current.session.worker).toEqual(workerData);
    expect(result.current.session.patients).toEqual([]);
    expect(result.current.session.sessionStart).toBeDefined();
    expect(localStorage.setItem).toHaveBeenCalledWith(SESSION_KEY, expect.any(String));
  });

  it('should end a session', () => {
    const { result } = renderHook(() => useCHWSession());

    act(() => {
      result.current.startSession({ name: 'Worker' });
    });

    expect(result.current.session).not.toBeNull();

    act(() => {
      result.current.endSession();
    });

    expect(result.current.session).toBeNull();
    expect(localStorage.removeItem).toHaveBeenCalledWith(SESSION_KEY);
  });

  it('should add a patient to the session', () => {
    const { result } = renderHook(() => useCHWSession());

    act(() => {
      result.current.startSession({ name: 'Worker' });
    });

    const patientData = { name: 'John Doe', age: 30 };

    act(() => {
      result.current.addPatient(patientData);
    });

    expect(result.current.session.patients).toHaveLength(1);
    expect(result.current.session.patients[0]).toMatchObject({
      ...patientData,
      overallRisk: 'normal',
      results: []
    });
    expect(result.current.session.patients[0].id).toBeDefined();
  });

  it('should update patient result and escalate risk level', () => {
    const { result } = renderHook(() => useCHWSession());

    act(() => {
      result.current.startSession({ name: 'Worker' });
    });

    const patientData = { name: 'Jane Doe', age: 25 };
    act(() => {
      result.current.addPatient(patientData);
    });

    const patientId = result.current.session.patients[0].id;
    const diagnosticResult = { type: 'eye', riskLevel: 'warning', message: 'Seek consultation' };

    act(() => {
      result.current.updatePatientResult(patientId, diagnosticResult);
    });

    let patient = result.current.getPatientById(patientId);
    expect(patient.results).toContainEqual(diagnosticResult);
    expect(patient.overallRisk).toBe('warning');

    // Escalate to critical
    const criticalResult = { type: 'skin', riskLevel: 'critical', message: 'Urgent care needed' };
    act(() => {
      result.current.updatePatientResult(patientId, criticalResult);
    });

    patient = result.current.getPatientById(patientId);
    expect(patient.overallRisk).toBe('critical');

    // Warning should not downgrade critical
    act(() => {
      result.current.updatePatientResult(patientId, { type: 'eye', riskLevel: 'warning' });
    });
    patient = result.current.getPatientById(patientId);
    expect(patient.overallRisk).toBe('critical');

    // Check persistence to global results
    expect(localStorage.setItem).toHaveBeenCalledWith(RESULTS_KEY, expect.any(String));
  });

  it('should return null for non-existent patient ID', () => {
    const { result } = renderHook(() => useCHWSession());
    act(() => {
      result.current.startSession({ name: 'Worker' });
    });

    expect(result.current.getPatientById('non-existent')).toBeNull();
  });
});
