import { useEffect } from 'react';
import { initAutoSave } from '../persistence/autoSave';

export function useAutoSave() {
  useEffect(() => {
    const unsubscribe = initAutoSave();
    return unsubscribe;
  }, []);
}
