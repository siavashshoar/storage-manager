// این کلاس کارای پایه‌ای مربوط به localStorage رو مدیریت می‌کنه
// This class manages basic localStorage functionality.
class StorageManager {
  // این متد یه آیتم رو توی localStorage ذخیره می‌کنه و اتوماتیک به JSON تبدیلش می‌کنه
  // Store an item in localStorage with automatic JSON conversion.
  setItem<T>(key: string, value: T): void {
    // از Generic برای تعیین نوع استفاده می‌کنیم
    localStorage.setItem(key, JSON.stringify(value));
  }

  // این متد یه آیتم رو از localStorage برمی‌داره و برمی‌گردونه به حالت اصلی خودش
  // Retrieve an item from localStorage and parse it back to its original form.
  getItem<T>(key: string): T | null {
    // از Generic برای خروجی استفاده می‌کنیم
    const value = localStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  }
}

// این کلاس رو صادر می‌کنیم تا توی بقیه ماژول‌ها هم بشه ازش استفاده کرد
// Exporting the class for use in other modules.
export default StorageManager;
