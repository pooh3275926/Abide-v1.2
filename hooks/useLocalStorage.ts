// hooks/useLocalStorage.ts
// FIX: Import Dispatch and SetStateAction from 'react' to make the types available.
import { useState, useEffect, useRef, Dispatch, SetStateAction } from 'react';

const STORAGE_CHANGE_EVENT = 'onLocalStorageChange';

type Serializer<T> = (value: T) => string;
type Deserializer<T> = (value: string) => T;

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  options?: { serializer?: Serializer<T>; deserializer?: Deserializer<T>; syncAcrossTabs?: boolean }
): [T, Dispatch<SetStateAction<T>>] {
  const serializer = options?.serializer ?? JSON.stringify;
  const deserializer = options?.deserializer ?? JSON.parse;

  // 使用 useRef 確保 key 在 useEffect 依賴中是穩定的
  const keyRef = useRef(key);
  useEffect(() => {
    keyRef.current = key;
  }, [key]);

  // 1. 初始化
  const [storedValue, setStoredValue] = useState<T>(() => {
    // 檢查是否在瀏覽器環境
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(keyRef.current);
      return item ? deserializer(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${keyRef.current}":`, error);
      return initialValue;
    }
  });

  // 2. 寫入 localStorage 並發送自訂事件
  useEffect(() => {
    // 檢查是否在瀏覽器環境
    if (typeof window === 'undefined') {
        return;
    }
    try {
      const valueToStore = serializer(storedValue);
      window.localStorage.setItem(keyRef.current, valueToStore);
      // 發送自定義事件，用於同頁面不同組件之間的同步
      window.dispatchEvent(new CustomEvent(STORAGE_CHANGE_EVENT, { detail: { key: keyRef.current, value: storedValue } }));
    } catch (error) {
      console.error(`Error setting localStorage key "${keyRef.current}":`, error);
    }
  }, [keyRef, storedValue, serializer]); // 使用 keyRef.current 作為依賴

  // 3. 監聽自訂事件，同頁同步
  useEffect(() => {
    // 檢查是否在瀏覽器環境
    if (typeof window === 'undefined') {
        return;
    }
    const handleStorageChange = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.key === keyRef.current) {
        // console.log(`[useLocalStorage] 同頁面同步: Key "${keyRef.current}" updated.`, customEvent.detail.value); // 偵錯用
        setStoredValue(customEvent.detail.value);
      }
    };
    window.addEventListener(STORAGE_CHANGE_EVENT, handleStorageChange);
    return () => window.removeEventListener(STORAGE_CHANGE_EVENT, handleStorageChange);
  }, [keyRef]); // 使用 keyRef.current 作為依賴

  // 4. 選擇性跨 tab 同步
  useEffect(() => {
    // 檢查是否在瀏覽器環境
    if (typeof window === 'undefined' || !options?.syncAcrossTabs) {
        return;
    }

    const handleTabStorage = (event: StorageEvent) => {
      if (event.key === keyRef.current && event.newValue) {
        try {
          // console.log(`[useLocalStorage] 跨頁籤同步: Key "${keyRef.current}" updated.`, event.newValue); // 偵錯用
          const newValue = deserializer(event.newValue);
          setStoredValue(newValue);
        } catch(error) {
          console.warn(`[useLocalStorage] Failed to parse localStorage value for key "${keyRef.current}" from other tab:`, error);
        }
      }
    };
    window.addEventListener('storage', handleTabStorage);
    return () => window.removeEventListener('storage', handleTabStorage);
  }, [keyRef, deserializer, options?.syncAcrossTabs]); // 使用 keyRef.current 作為依賴

  return [storedValue, setStoredValue];
}