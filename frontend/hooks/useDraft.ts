import { useState, useEffect } from "react";

export function useDraft<T>(key: string, initialValue: T): [T, (val: T) => void, () => void] {
  const [state, setState] = useState<T>(initialValue);
  const [mounted, setMounted] = useState(false);

  // Initialize from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        setState(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Failed to load draft from local storage", e);
    }
    setMounted(true);
  }, [key]);

  // Save to localStorage on change
  useEffect(() => {
    if (mounted) {
      try {
        localStorage.setItem(key, JSON.stringify(state));
      } catch (e) {
        console.warn("Failed to save draft to local storage", e);
      }
    }
  }, [key, state, mounted]);

  const clearDraft = () => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // ignore
    }
    setState(initialValue);
  };

  return [state, setState, clearDraft];
}
