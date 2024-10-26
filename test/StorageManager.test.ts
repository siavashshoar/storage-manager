import StorageManager from "../src/StorageManager";

// Mocking localStorage and sessionStorage
const localStorageMock = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem(key: string) {
      return store[key] || null;
    },
    setItem(key: string, value: string) {
      store[key] = value.toString();
    },
    removeItem(key: string) {
      delete store[key];
    },
    clear() {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

Object.defineProperty(window, "sessionStorage", {
  value: localStorageMock,
});

describe("StorageManager", () => {
  let storageManager: StorageManager;

  beforeEach(() => {
    storageManager = new StorageManager({
      encryptionKey: null,
      useSessionStorage: false,
      useEncryption: false,
      useExpiration: false,
      useCompression: false,
    });
  });

  test("should store and retrieve data correctly", () => {
    storageManager.setItem("testKey", "testValue");
    const retrievedValue = storageManager.getItem("testKey");
    expect(retrievedValue).toBe("testValue");
  });

  test("should handle expiration of data", (done) => {
    storageManager.enableExpiration(); // فعال کردن انقضا
    storageManager.setItem("tempKey", "tempValue", 100); // انقضای ۱۰۰ میلی‌ثانیه

    setTimeout(() => {
      const retrievedValue = storageManager.getItem("tempKey");
      expect(retrievedValue).toBeNull();
      done();
    }, 150);
  });

  test("should encrypt and decrypt data correctly when encryption is enabled", () => {
    const manager = new StorageManager({
      encryptionKey: "test-key",
      useEncryption: true,
    });

    manager.setItem("testKey", "testValue");
    const retrievedValue = manager.getItem("testKey");

    expect(retrievedValue).toBe("testValue");
  });

  test("should not decrypt correctly with incorrect encryption key", () => {
    const managerWithEncryption = new StorageManager({
      encryptionKey: "correct-key",
      useEncryption: true,
    });

    managerWithEncryption.setItem("testKey", "testValue");

    const managerWithWrongKey = new StorageManager({
      encryptionKey: "wrong-key",
      useEncryption: true,
    });

    const retrievedValue = managerWithWrongKey.getItem("testKey");
    expect(retrievedValue).not.toBe("testValue"); // یا undefined بسته به مدیریت خطا
  });

  test("should store data without encryption when encryption is disabled", () => {
    const manager = new StorageManager({
      useEncryption: false,
    });

    manager.setItem("testKey", "testValue");
    const retrievedValue = manager.getItem("testKey");

    expect(retrievedValue).toBe("testValue");
  });

  test("should compress and decompress data correctly", () => {
    const storageManager = new StorageManager({
      useCompression: true,
    });
    storageManager.setItem("testKey", "testValue");
    const result = storageManager.getItem("testKey");
    expect(result).toBe("testValue");
  });

  test("should handle storage quota exceeded error", () => {
    const storageManager = new StorageManager({
      useCompression: false,
      useEncryption: false,
    });

    jest
      .spyOn(StorageManager.prototype, "isStorageSupported")
      .mockReturnValue(true);

    // شبیه‌سازی خطای پر شدن فضا
    storageManager.simulateQuotaExceeded();

    console.warn = jest.fn(); // Mock `console.warn`

    storageManager.setItem("testKey", "testValue");

    expect(console.warn).toHaveBeenCalledWith("Storage limit exceeded.");
  });

  test("should warn if Storage API is not supported", () => {
    const storageManager = new StorageManager({});

    jest.spyOn(storageManager, "isStorageSupported").mockReturnValue(false);
    console.warn = jest.fn();

    storageManager.setItem("testKey", "testValue");

    expect(console.warn).toHaveBeenCalledWith(
      "Storage API is not supported by this browser."
    );
  });
});
