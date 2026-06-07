import { useState, useEffect, useCallback } from 'react';

const SESSION_KEY = 'visiondx_chw_session';
const RESULTS_KEY = 'visiondx_chw_results'; // To persist history if needed

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
    setSession(prev => {
      if (!prev) return prev;
      
      const newPatient = {
        id: crypto.randomUUID(),
        ...patientData,
        results: [],
        overallRisk: 'normal',
        timestamp: new Date().toISOString()
      };
      
      return {
        ...prev,
        patients: [...prev.patients, newPatient]
      };
    });
  }, []);

  const updatePatientResult = useCallback((patientId, diagnosticResult) => {
    setSession(prev => {
      if (!prev) return prev;

      const updatedPatients = prev.patients.map(p => {
        if (p.id !== patientId) return p;

        const updatedResults = [...p.results, diagnosticResult];
        
        // Calculate new overall risk
        let newRisk = p.overallRisk;
        if (diagnosticResult.riskLevel === 'critical') newRisk = 'critical';
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
