import CryptoJS from "crypto-js";

// کلاس مدیریت localStorage و sessionStorage با تنظیمات اختیاری برای رمزنگاری و انقضا
// This class manages localStorage and sessionStorage with optional encryption and expiration settings.
class StorageManager {
  private encryptionKey: string | null;
  private storageType: Storage;
  private useEncryption: boolean;
  private useExpiration: boolean;

  // سازنده که اجازه می‌ده ویژگی‌ها به طور دلخواه فعال بشن، بدون اینکه هیچ کدوم پیش‌فرض true باشن
  // Constructor that allows optional features without any default being true.
  constructor(options: {
    encryptionKey?: string;
    useSessionStorage?: boolean;
    useEncryption?: boolean;
    useExpiration?: boolean;
  }) {
    this.encryptionKey = options.encryptionKey || null;
    this.storageType = options.useSessionStorage
      ? sessionStorage
      : localStorage;
    this.useEncryption = options.useEncryption ?? false; // پیش‌فرض: رمزنگاری غیرفعال
    this.useExpiration = options.useExpiration ?? false; // پیش‌فرض: انقضا غیرفعال
  }

  // بررسی پشتیبانی از Storage API
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

  // ذخیره آیتم با رمزنگاری و انقضا به صورت اختیاری
  // Store an item with optional encryption and expiration.
  setItem<T>(key: string, value: T, expirationInMs?: number): void {
    if (!this.isStorageSupported()) return;

    let item: any = { value: value };

    if (this.useExpiration && expirationInMs) {
      item.expiration = Date.now() + expirationInMs;
    }

    let dataToStore = JSON.stringify(item);

    if (this.useEncryption && this.encryptionKey) {
      dataToStore = CryptoJS.AES.encrypt(
        dataToStore,
        this.encryptionKey
      ).toString();
    }

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
        `Not enough storage space. Required: ${dataSize} bytes, Available: ${remainingSpace} bytes.`
      );
      return;
    }

    try {
      this.storageType.setItem(key, dataToStore);
    } catch (error) {
      console.error("Error storing data: ", error as any);
      if ((error as any).name === "QuotaExceededError") {
        console.warn("Storage limit exceeded.");
      }
    }
  }

  // بازیابی آیتم و چک کردن انقضا یا رمزگشایی در صورت فعال بودن
  // Retrieve an item and check expiration or decrypt if enabled.
  getItem<T>(key: string): T | null {
    const storedData = this.storageType.getItem(key);
    if (!storedData) return null;

    let dataString = storedData;

    // رمزگشایی در صورت فعال بودن
    // Decrypt if enabled.
    if (this.useEncryption && this.encryptionKey) {
      const bytes = CryptoJS.AES.decrypt(storedData, this.encryptionKey);
      dataString = bytes.toString(CryptoJS.enc.Utf8);
    }

    const item = JSON.parse(dataString) as { value: T; expiration?: number };

    // چک کردن انقضا در صورت فعال بودن
    // Check expiration if enabled.
    if (this.useExpiration && item.expiration && Date.now() > item.expiration) {
      this.storageType.removeItem(key);
      return null;
    }

    return item.value;
  }

  // حذف آیتم
  // Remove an item.
  removeItem(key: string): void {
    this.storageType.removeItem(key);
  }
}

// صادر کردن کلاس برای استفاده در جاهای دیگه
// Exporting the class for use in other modules.
export default StorageManager;
