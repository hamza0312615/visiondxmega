import React, { createContext, useContext, useState } from 'react';
import { useCHWSession } from '../hooks/useCHWSession';

const CHWContext = createContext(null);

export function CHWProvider({ children }) {
  const chwSession = useCHWSession();
  const [activePatientId, setActivePatientId] = useState(null);

  const value = {
    ...chwSession,
    activePatientId,
    setActivePatientId
  };

  return (
    <CHWContext.Provider value={value}>
      {children}
    </CHWContext.Provider>
  );
}

export function useCHW() {
  const context = useContext(CHWContext);
  if (!context) {
    throw new Error('useCHW must be used within a CHWProvider');
  }
  return context;
}
