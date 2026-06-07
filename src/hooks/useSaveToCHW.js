import { useSearchParams } from 'react-router-dom';
import { useCHW } from '../context/CHWContext';

export function useSaveToCHW() {
  const { session, updatePatientResult } = useCHW();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patientId');

  const saveToCHW = (moduleName, summary, riskLevel, rawData = null) => {
    // If no CHW session is active, or no patientId in URL, do nothing.
    // This allows the module to work normally for standalone users.
    if (!session || !patientId) return;

    const result = {
      id: crypto.randomUUID(),
      moduleName,
      summary,
      riskLevel,
      timestamp: new Date().toISOString(),
      rawData
    };

    updatePatientResult(patientId, result);
    console.log(`[CHW Mode] Saved ${moduleName} result for patient ${patientId}`);
  };

  return { saveToCHW, isCHWMode: !!(session && patientId) };
}
