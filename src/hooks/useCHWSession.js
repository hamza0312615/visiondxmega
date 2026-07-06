import { useState, useEffect, useCallback } from 'react';

const SESSION_KEY = 'visiondx_chw_session';
const RESULTS_KEY = 'visiondx_chw_results'; // To persist history if needed
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function syncPatientToDb(patient) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: patient.id,
        name: patient.name,
        age: (patient.age || '').toString(),
        gender: patient.gender || 'Male',
        city: patient.city || 'Unknown'
      })
    });
    if (res.ok) {
      console.log(`[Sync DB] Patient ${patient.name} synced to SQLite database`);
    }
  } catch (err) {
    console.error('[Sync DB] Failed to sync patient profile:', err);
  }
}

async function syncResultToDb(patientId, result) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/history/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: patientId,
        records: [result]
      })
    });
    if (res.ok) {
      console.log(`[Sync DB] Diagnostic result synced to SQLite database`);
    }
  } catch (err) {
    console.error('[Sync DB] Failed to sync diagnostic result:', err);
  }
}

export function useCHWSession() {
  const [session, setSession] = useState(null);
  
  // Load session from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        setSession(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load CHW session from localStorage', e);
    }
  }, []);

  // Save session to localStorage whenever it changes
  useEffect(() => {
    if (session) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
  }, [session]);

  const startSession = useCallback((workerData) => {
    const newSession = {
      worker: workerData,
      sessionStart: new Date().toISOString(),
      patients: []
    };
    setSession(newSession);
  }, []);

  const endSession = useCallback(() => {
    setSession(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  const addPatient = useCallback((patientData) => {
    const newPatient = {
      id: crypto.randomUUID(),
      ...patientData,
      results: [],
      overallRisk: 'normal',
      timestamp: new Date().toISOString()
    };

    setSession(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        patients: [...prev.patients, newPatient]
      };
    });

    // Synchronize asynchronously to the SQLite backend
    syncPatientToDb(newPatient);
  }, []);

  const updatePatientResult = useCallback((patientId, diagnosticResult) => {
    // Generate result ID if not present
    if (!diagnosticResult.id) {
      diagnosticResult.id = Date.now().toString() + Math.random().toString().slice(2, 6);
    }

    setSession(prev => {
      if (!prev) return prev;

      const updatedPatients = prev.patients.map(p => {
        if (p.id !== patientId) return p;

        const updatedResults = [...p.results, diagnosticResult];
        
        // Calculate new overall risk
        let newRisk = p.overallRisk;
        if (diagnosticResult.riskLevel === 'critical' || diagnosticResult.riskLevel === 'emergency') newRisk = 'critical';
        else if (diagnosticResult.riskLevel === 'warning' && newRisk !== 'critical') newRisk = 'warning';

        return {
          ...p,
          results: updatedResults,
          overallRisk: newRisk
        };
      });

      // Persist results globally just in case session is lost
      const globalResults = JSON.parse(localStorage.getItem(RESULTS_KEY) || '{}');
      if (!globalResults[patientId]) globalResults[patientId] = [];
      globalResults[patientId].push(diagnosticResult);
      localStorage.setItem(RESULTS_KEY, JSON.stringify(globalResults));

      return {
        ...prev,
        patients: updatedPatients
      };
    });

    // Synchronize result asynchronously to SQLite backend
    syncResultToDb(patientId, diagnosticResult);
  }, []);

  const getPatientById = useCallback((id) => {
    if (!session) return null;
    return session.patients.find(p => p.id === id) || null;
  }, [session]);

  return {
    session,
    startSession,
    endSession,
    addPatient,
    updatePatientResult,
    getPatientById
  };
}
