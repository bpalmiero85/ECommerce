import { useEffect, useState } from "react";

const useLocalStorage = (key, initialValue) => {
  const [value, setValue] = useState(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : initialValue;
    } catch (e) {
      return initialValue;
    }
  });
  useEffect(() => {
    try{
     localStorage.setItem(key, JSON.stringify(value));
    } catch {

    } 
  }, [key, value]);
  
  return [value, setValue];
};
export default useLocalStorage;
