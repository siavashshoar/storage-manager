import CryptoJS from "crypto-js";

// کلاس مدیریت localStorage و sessionStorage با تنظیمات دلخواه برای رمزنگاری، فشرده‌سازی و انقضا
class StorageManager {
  private encryptionKey: string | null;
  private storageType: Storage;
  private useEncryption: boolean;
  private useExpiration: boolean;
  private useCompression: boolean;

  constructor(options: {
    encryptionKey?: string | null;
    useSessionStorage?: boolean;
    useEncryption?: boolean;
    useExpiration?: boolean;
    useCompression?: boolean;
  }) {
    this.encryptionKey = options.encryptionKey || null;
    this.storageType = options.useSessionStorage
      ? sessionStorage
      : localStorage;
    this.useEncryption = options.useEncryption ?? false; // پیش‌فرض: رمزنگاری غیرفعال
    this.useExpiration = options.useExpiration ?? false; // پیش‌فرض: انقضا غیرفعال
    this.useCompression = options.useCompression ?? false; // پیش‌فرض: فشرده‌سازی غیرفعال
  }

  // چک کردن اینکه مرورگر پشتیبانی می‌کند یا نه
  isStorageSupported(): boolean {
    try {
      const testKey = "__test__";
      this.storageType.setItem(testKey, "test");
      this.storageType.removeItem(testKey);
      return true;
    } catch (error) {
      console.warn("Storage API is not supported by this browser.");
      return false;
    }
  }

  // فشرده‌سازی داده‌ها با استفاده از Base64
  compressData(data: string): string {
    return btoa(unescape(encodeURIComponent(data)));
  }

  // از فشرده خارج کردن داده‌های Base64
  decompressData(data: string): string {
    return decodeURIComponent(escape(atob(data)));
  }

  // فعال و غیرفعال کردن انقضا
  enableExpiration() {
    this.useExpiration = true;
  }

  disableExpiration() {
    this.useExpiration = false;
  }

  // شبیه‌سازی خطای پر شدن فضا
  public simulateQuotaExceeded() {
    jest.spyOn(this.storageType, "setItem").mockImplementation(() => {
      const error = new Error("QuotaExceededError");
      (error as any).name = "QuotaExceededError";
      throw error;
    });
  }

  // ذخیره کردن داده با گزینه‌های رمزنگاری، فشرده‌سازی و انقضا
  setItem<T>(key: string, value: T, expirationInMs?: number): void {
    if (!this.isStorageSupported()) {
      console.warn("Storage API is not supported by this browser.");
      return;
    }

    let item: any = { value: value };

    if (this.useExpiration && expirationInMs) {
      item.expiration = Date.now() + expirationInMs;
    }

    let dataToStore = JSON.stringify(item);

    // فشرده‌سازی قبل از رمزنگاری
    if (this.useCompression) {
      dataToStore = this.compressData(dataToStore);
    }

    if (this.useEncryption && this.encryptionKey) {
      try {
        dataToStore = CryptoJS.AES.encrypt(
          dataToStore,
          this.encryptionKey
        ).toString();
      } catch (error) {
        console.warn("Error encrypting data:", (error as any).message);
        return;
      }
    }

    try {
      const totalStorage = 5 * 1024 * 1024;
      let usedStorage = 0;

      for (let i = 0; i < this.storageType.length; i++) {
        const key = this.storageType.key(i);
        if (key) {
          usedStorage += (this.storageType.getItem(key)?.length || 0) * 2;
        }
      }

      const remainingSpace = totalStorage - usedStorage;
      const dataSize = new Blob([dataToStore]).size;

      if (remainingSpace < dataSize) {
        console.warn(
          `Storage limit exceeded. Required: ${dataSize} bytes, Available: ${remainingSpace} bytes.`
        );
        return;
      }

      this.storageType.setItem(key, dataToStore);
    } catch (error) {
      if ((error as any).name === "QuotaExceededError") {
        console.warn("Storage limit exceeded.");
      } else {
        console.error("Error storing data:", error);
      }
    }
  }

  // بازیابی داده با بررسی رمزنگاری و انقضا
  getItem<T>(key: string): T | null {
    const storedData = this.storageType.getItem(key);
    if (!storedData) return null;

    let dataString = storedData;

    // رمزگشایی در صورت فعال بودن
    if (this.useEncryption && this.encryptionKey) {
      try {
        const bytes = CryptoJS.AES.decrypt(dataString, this.encryptionKey);
        dataString = bytes.toString(CryptoJS.enc.Utf8);

        // بررسی خالی بودن داده پس از رمزگشایی
        if (!dataString) {
          console.warn(
            "Failed to decrypt data: possibly due to incorrect encryption key or malformed data."
          );
          return null;
        }
      } catch (error) {
        console.warn("Error decrypting data:", (error as any).message);
        return null;
      }
    }

    // از فشرده خارج کردن داده‌ها در صورت فعال بودن
    if (this.useCompression) {
      try {
        dataString = this.decompressData(dataString);
      } catch (error) {
        console.warn("Error decompressing data:", (error as any).message);
        return null;
      }
    }

    try {
      const item = JSON.parse(dataString) as { value: T; expiration?: number };

      // چک کردن انقضا
      if (
        this.useExpiration &&
        item.expiration &&
        Date.now() > item.expiration
      ) {
        this.storageType.removeItem(key);
        return null;
      }

      return item.value;
    } catch (error) {
      console.warn("Error parsing data:", (error as any).message);
      return null;
    }
  }

  // حذف داده
  removeItem(key: string): void {
    this.storageType.removeItem(key);
  }
}

export default StorageManager;
