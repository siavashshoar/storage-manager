import CryptoJS from "crypto-js";

// این کلاس مدیریت localStorage و sessionStorage رو به همراه رمزنگاری و قابلیت انقضای داده‌ها انجام می‌ده
// This class manages both localStorage and sessionStorage with encryption and data expiration.
class StorageManager {
  private encryptionKey: string;
  private storageType: Storage; // تعیین نوع storage (localStorage یا sessionStorage)

  // constructor به ما اجازه می‌ده انتخاب کنیم از کدوم storage استفاده کنیم
  // The constructor lets us choose between localStorage and sessionStorage.
  constructor(encryptionKey: string, useSessionStorage: boolean = false) {
    this.encryptionKey = encryptionKey;
    this.storageType = useSessionStorage ? sessionStorage : localStorage;
  }

  // ذخیره آیتم با رمزنگاری و امکان تنظیم زمان انقضا
  // Store an item with encryption and an optional expiration time.
  setItem<T>(key: string, value: T, expirationInMs?: number): void {
    const item = {
      value: value,
      expiration: expirationInMs ? Date.now() + expirationInMs : null,
    };

    // رمزنگاری داده‌ها
    // Encrypt the data.
    const encryptedData = CryptoJS.AES.encrypt(
      JSON.stringify(item),
      this.encryptionKey
    ).toString();
    this.storageType.setItem(key, encryptedData);
  }

  // این متد آیتم رو برمی‌داره، رمزگشایی می‌کنه و اگه منقضی شده باشه پاکش می‌کنه
  // Retrieve, decrypt the item, and remove it if expired.
  getItem<T>(key: string): T | null {
    const encryptedData = this.storageType.getItem(key);
    if (!encryptedData) return null;

    // رمزگشایی داده‌ها
    // Decrypt the data.
    const bytes = CryptoJS.AES.decrypt(encryptedData, this.encryptionKey);
    const itemString = bytes.toString(CryptoJS.enc.Utf8);
    const item = JSON.parse(itemString) as {
      value: T;
      expiration: number | null;
    };

    // چک کردن زمان انقضا
    // Check if the item has expired.
    if (item.expiration && Date.now() > item.expiration) {
      this.storageType.removeItem(key);
      return null;
    }
    return item.value;
  }

  // حذف کردن آیتم
  // Remove an item.
  removeItem(key: string): void {
    this.storageType.removeItem(key);
  }
}

// صادر کردن کلاس برای استفاده در جاهای دیگه
// Exporting the class for use in other modules.
export default StorageManager;
