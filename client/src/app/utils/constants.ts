export const DEFAULT_CATEGORIES = [
  'Food & Drink',
  'Transport',
  'Groceries',
  'Health',
  'Gym & Fitness',
  'Personal Care',
  'Shopping',
  'Entertainment',
  'Subscriptions',
  'Miscellaneous',
];

export const PAYMENT_MODES = ['Account', 'Cash', 'Credit Card'];

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const MAX_HABITS = 5;

export function getTodayIndex(): number {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

export function formatCurrency(n: number): string {
  const abs = Math.abs(n);
  return `₹${abs.toLocaleString('en-IN')}`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function currentMonthStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
