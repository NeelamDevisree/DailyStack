import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  // Settings
  getSettings() { return firstValueFrom(this.http.get<any>('/api/settings')); }
  updateSettings(daily_allowance: number) { return firstValueFrom(this.http.put<any>('/api/settings', { daily_allowance })); }

  // Habits
  getHabits() { return firstValueFrom(this.http.get<any[]>('/api/habits')); }
  addHabit(name: string, days: number[]) { return firstValueFrom(this.http.post<any>('/api/habits', { name, days })); }
  addHabitsBulk(habits: { name: string; days: number[] }[]) { return firstValueFrom(this.http.post<any[]>('/api/habits/bulk', { habits })); }
  deactivateHabit(id: string) { return firstValueFrom(this.http.put<any>(`/api/habits/${id}/deactivate`, {})); }
  deactivateHabitsBulk(ids: string[]) { return firstValueFrom(this.http.put<any>('/api/habits/deactivate-bulk', { ids })); }

  // Habit logs
  getHabitLogs(from?: string) { return firstValueFrom(this.http.get<any[]>('/api/habit-logs', { params: from ? { from } : {} })); }
  addHabitLog(habit_id: string, date: string, status: string) { return firstValueFrom(this.http.post<any>('/api/habit-logs', { habit_id, date, status })); }
  updateHabitLog(id: string, status: string) { return firstValueFrom(this.http.put<any>(`/api/habit-logs/${id}`, { status })); }
  deleteHabitLog(id: string) { return firstValueFrom(this.http.delete<any>(`/api/habit-logs/${id}`)); }

  // Expenses
  getExpenses(from?: string) { return firstValueFrom(this.http.get<any[]>('/api/expenses', { params: from ? { from } : {} })); }
  addExpense(data: { description: string; amount: number; category: string; payment_mode: string }) { return firstValueFrom(this.http.post<any>('/api/expenses', data)); }

  // Custom categories
  getCategories() { return firstValueFrom(this.http.get<any[]>('/api/categories')); }
  addCategory(name: string) { return firstValueFrom(this.http.post<any>('/api/categories', { name })); }

  // Withdrawals
  getWithdrawals(from?: string) { return firstValueFrom(this.http.get<any[]>('/api/withdrawals', { params: from ? { from } : {} })); }
  addWithdrawal(amount: number, date: string) { return firstValueFrom(this.http.post<any>('/api/withdrawals', { amount, date })); }

  // Carry over
  getCarryOver() { return firstValueFrom(this.http.get<any>('/api/carry-over')); }
  updateCarryOver(amount: number) { return firstValueFrom(this.http.put<any>('/api/carry-over', { amount })); }

  // Month setup
  getMonthSetup(month: string) { return firstValueFrom(this.http.get<any>('/api/month-setup', { params: { month } })); }
  createMonthSetup(month: string) { return firstValueFrom(this.http.post<any>('/api/month-setup', { month })); }

  // Archive
  getArchives() { return firstValueFrom(this.http.get<any[]>('/api/archive')); }
  createArchive(data: any) { return firstValueFrom(this.http.post<any>('/api/archive', data)); }
}
