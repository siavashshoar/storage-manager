// این کلاس localStorage رو مدیریت می‌کنه و بهش قابلیت انقضای داده‌ها رو اضافه می‌کنه
// This class manages localStorage and adds data expiration functionality.
class StorageManager {
  // ذخیره آیتم با امکان تنظیم زمان انقضا
  // Store an item with an optional expiration time (in milliseconds).
  setItem<T>(key: string, value: T, expirationInMs?: number): void {
    const item = {
      value: value,
      expiration: expirationInMs ? Date.now() + expirationInMs : null,
    };
    localStorage.setItem(key, JSON.stringify(item));
  }

  // این متد آیتم رو برمی‌داره، اگر منقضی شده باشه پاکش می‌کنه
  // Retrieve an item; if expired, it removes the item.
  getItem<T>(key: string): T | null {
    const itemString = localStorage.getItem(key);
    if (!itemString) return null;

    const item = JSON.parse(itemString) as {
      value: T;
      expiration: number | null;
    };
    if (item.expiration && Date.now() > item.expiration) {
      // آیتم منقضی شده، پاکش می‌کنیم
      // Item has expired, so we remove it.
      localStorage.removeItem(key);
      return null;
    }
    return item.value;
  }
}

// صادر کردن کلاس برای استفاده در بقیه جاها
// Exporting the class for use in other modules.
export default StorageManager;
