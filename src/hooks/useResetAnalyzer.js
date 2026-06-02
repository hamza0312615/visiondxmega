import { useCallback } from 'react';

export function useResetAnalyzer({
  setImageFile,
  setImagePreview,
  setPresetData,
  setCurrentResult,
  setError,
  setAudioFile,
  setAudioFileName,
  customReset
}) {
  return useCallback(() => {
    if (setImageFile) setImageFile(null);
    if (setImagePreview) setImagePreview('');
    if (setPresetData) setPresetData(null);
    if (setCurrentResult) setCurrentResult(null);
    if (setError) setError('');

    // For audio-based analyzers
    if (setAudioFile) setAudioFile(null);
    if (setAudioFileName) setAudioFileName('');

    // Any additional specific reset logic
    if (customReset) customReset();
  }, [
    setImageFile,
    setImagePreview,
    setPresetData,
    setCurrentResult,
    setError,
    setAudioFile,
    setAudioFileName,
    customReset
  ]);
}
