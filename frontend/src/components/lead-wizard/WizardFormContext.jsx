import { createContext, useContext } from 'react';

export const WizardFormContext = createContext(null);

export function useWizardForm() {
  const ctx = useContext(WizardFormContext);
  if (!ctx) {
    throw new Error('useWizardForm must be used within WizardFormContext.Provider');
  }
  return ctx;
}
