
export interface Employee {
  id: string;
  name: string;
  meals: MealRecord[];
  payments: PaymentRecord[];
}

export interface MealRecord {
  id: string;
  employeeId: string;
  date: string; // ISO string
  paid: boolean;
}

export interface PaymentRecord {
  id: string;
  employeeId: string;
  date: string; // ISO string
  amount: number;
}

export interface AppSettings {
  mealPrice: number;
}
