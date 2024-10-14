// این کلاس مدیریت localStorage رو به همراه رمزنگاری و قابلیت انقضای داده‌ها انجام می‌ده
// This class manages localStorage with encryption and data expiration.
class StorageManager {
  private encryptionKey: string;

  // توی constructor یه کلید رمزنگاری وارد می‌کنیم
  // The encryption key is passed in through the constructor.
  constructor(encryptionKey: string) {
    this.encryptionKey = encryptionKey;
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
    localStorage.setItem(key, encryptedData);
  }

  // این متد آیتم رو برمی‌داره، رمزگشایی می‌کنه و اگه منقضی شده باشه پاکش می‌کنه
  // Retrieve, decrypt the item, and remove it if expired.
  getItem<T>(key: string): T | null {
    const encryptedData = localStorage.getItem(key);
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
      localStorage.removeItem(key);
      return null;
    }
    return item.value;
  }
}

// صادر کردن کلاس برای استفاده در جاهای دیگه
// Exporting the class for use in other modules.
export default StorageManager;
