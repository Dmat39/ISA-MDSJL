import { useState, useEffect } from 'react';

const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;

export const usePersistedState = (key, defaultValue, expiry = EIGHT_HOURS_MS) => {
  const getInitialValue = () => {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;

    try {
      const parsed = JSON.parse(item);
      if (Date.now() - parsed.timestamp < expiry) {
        return parsed.value;
      } else {
        localStorage.removeItem(key);
      }
    } catch {
      localStorage.removeItem(key);
    }

    return defaultValue;
  };

  const [value, setValue] = useState(getInitialValue);

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify({ value, timestamp: Date.now() }));
  }, [key, value]);

  return [value, setValue];
};
