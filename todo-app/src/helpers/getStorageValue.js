export const getStorageValue = ({ key, defaultValue }) => {
  const saved = localStorage.getItem(key);
  return JSON.parse(saved) || defaultValue;
};
