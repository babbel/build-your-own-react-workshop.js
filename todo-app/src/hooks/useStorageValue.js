import { useState, useEffect } from 'react';
import { getStorageValue } from '../helpers/getStorageValue';

export const useLocalStorage = (key, defaultValue) => {
  const [value, setValue] = useState(() =>
    getStorageValue({ key, defaultValue }),
  );

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
};
