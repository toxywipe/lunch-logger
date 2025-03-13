
import { Employee, MealRecord, PaymentRecord, AppSettings } from './types';

// Simple IndexedDB wrapper
class Database {
  private dbName = 'cantineo';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  // Initialize the database
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create stores if they don't exist
        if (!db.objectStoreNames.contains('employees')) {
          db.createObjectStore('employees', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('meals')) {
          const mealStore = db.createObjectStore('meals', { keyPath: 'id' });
          mealStore.createIndex('employeeId', 'employeeId', { unique: false });
          mealStore.createIndex('date', 'date', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('payments')) {
          const paymentStore = db.createObjectStore('payments', { keyPath: 'id' });
          paymentStore.createIndex('employeeId', 'employeeId', { unique: false });
          paymentStore.createIndex('date', 'date', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        // Initialize app settings if not exists
        this.getSettings().then(settings => {
          if (!settings) {
            this.saveSettings({ mealPrice: 5 });
          }
        });
        resolve();
      };

      request.onerror = (event) => {
        console.error('Database error:', (event.target as IDBOpenDBRequest).error);
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  // Employee methods
  async getAllEmployees(): Promise<Employee[]> {
    await this.ensureDbConnection();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['employees'], 'readonly');
      const store = transaction.objectStore('employees');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getEmployee(id: string): Promise<Employee | null> {
    await this.ensureDbConnection();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['employees'], 'readonly');
      const store = transaction.objectStore('employees');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async saveEmployee(employee: Employee): Promise<void> {
    await this.ensureDbConnection();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['employees'], 'readwrite');
      const store = transaction.objectStore('employees');
      const request = store.put(employee);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteEmployee(id: string): Promise<void> {
    await this.ensureDbConnection();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['employees', 'meals', 'payments'], 'readwrite');
      
      // Delete employee
      const employeeStore = transaction.objectStore('employees');
      employeeStore.delete(id);
      
      // Delete associated meals
      const mealStore = transaction.objectStore('meals');
      const mealIndex = mealStore.index('employeeId');
      const mealRequest = mealIndex.openCursor(IDBKeyRange.only(id));
      
      mealRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          mealStore.delete(cursor.primaryKey);
          cursor.continue();
        }
      };
      
      // Delete associated payments
      const paymentStore = transaction.objectStore('payments');
      const paymentIndex = paymentStore.index('employeeId');
      const paymentRequest = paymentIndex.openCursor(IDBKeyRange.only(id));
      
      paymentRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          paymentStore.delete(cursor.primaryKey);
          cursor.continue();
        }
      };

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // Meal methods
  async getMealsByEmployee(employeeId: string): Promise<MealRecord[]> {
    await this.ensureDbConnection();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['meals'], 'readonly');
      const store = transaction.objectStore('meals');
      const index = store.index('employeeId');
      const request = index.getAll(IDBKeyRange.only(employeeId));

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getMealsByDate(date: string): Promise<MealRecord[]> {
    await this.ensureDbConnection();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['meals'], 'readonly');
      const store = transaction.objectStore('meals');
      const index = store.index('date');
      const request = index.getAll(IDBKeyRange.only(date));

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveMeal(meal: MealRecord): Promise<void> {
    await this.ensureDbConnection();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['meals'], 'readwrite');
      const store = transaction.objectStore('meals');
      const request = store.put(meal);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async deleteMeal(id: string): Promise<void> {
    await this.ensureDbConnection();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['meals'], 'readwrite');
      const store = transaction.objectStore('meals');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Payment methods
  async getPaymentsByEmployee(employeeId: string): Promise<PaymentRecord[]> {
    await this.ensureDbConnection();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['payments'], 'readonly');
      const store = transaction.objectStore('payments');
      const index = store.index('employeeId');
      const request = index.getAll(IDBKeyRange.only(employeeId));

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async savePayment(payment: PaymentRecord): Promise<void> {
    await this.ensureDbConnection();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['payments'], 'readwrite');
      const store = transaction.objectStore('payments');
      const request = store.put(payment);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Settings methods
  async getSettings(): Promise<AppSettings | null> {
    await this.ensureDbConnection();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get('app-settings');

      request.onsuccess = () => resolve(request.result?.data || null);
      request.onerror = () => reject(request.error);
    });
  }

  async saveSettings(settings: AppSettings): Promise<void> {
    await this.ensureDbConnection();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      const request = store.put({ id: 'app-settings', data: settings });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Helper methods
  private async ensureDbConnection(): Promise<void> {
    if (!this.db) {
      await this.init();
    }
  }
}

// Singleton instance
const database = new Database();

export default database;
