// @flow
interface WebStorage {
  getItem: (key: string) => string | void;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

export interface Storage {
  getItem: (key: string) => Promise<string | void>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

const noop = (...args: any[]): any => undefined;
const noStorage: WebStorage = {
  getItem: noop,
  setItem: noop,
  removeItem: noop,
};
const promisifyStorage = (storage: WebStorage): Storage => ({
  getItem: (...args) =>
    new Promise(resolve => resolve(storage.getItem(...args))),
  setItem: (...args) =>
    new Promise(resolve => resolve(storage.setItem(...args))),
  removeItem: (...args) =>
    new Promise(resolve => resolve(storage.removeItem(...args))),
});

const getStorage = () => {
  let storage: WebStorage = self.localStorage;
  try {
    const testKey = 'testKey';
    const testValue = 'Value!';
    storage.setItem(testKey, testValue);
    storage.getItem(testKey);
    storage.removeItem(testKey);
  } catch (e) {
    console.warn(
      'Seems like storage is not working as expected. Falling back on in-memory storage.',
    );
    storage = noStorage;
  }
  return promisifyStorage(storage);
};

export { getStorage };
