import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { DAYS, MAX_HABITS, currentMonthStr, todayStr, formatCurrency } from '../../utils/constants';

@Component({
  selector: 'app-habits',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './habits.component.html',
  styleUrl: './habits.component.css'
})
export class HabitsComponent implements OnInit {
  habits: any[] = [];
  habitLogs: any[] = [];
  allowance = 0;
  loading = true;
  showAdd = false;
  newName = '';
  newDays = [0, 1, 2, 3, 4, 5, 6];
  error = '';

  DAYS = DAYS;
  MAX_HABITS = MAX_HABITS;

  allDates: string[] = [];
  today = todayStr();

  constructor(private api: ApiService) {}

  async ngOnInit() { await this.load(); }

  async load() {
    const month = currentMonthStr();
    const [habits, logs, settings] = await Promise.all([
      this.api.getHabits(),
      this.api.getHabitLogs(month + '-01'),
      this.api.getSettings(),
    ]);
    this.habits = habits || [];
    this.habitLogs = logs || [];
    this.allowance = settings?.daily_allowance ?? 0;
    this.buildDates();
    this.loading = false;
  }

  buildDates() {
    const dates = [...new Set(this.habitLogs.map(l => l.date))].sort((a, b) => b.localeCompare(a));
    if (!dates.includes(this.today)) dates.unshift(this.today);
    this.allDates = dates;
  }

  fmt(n: number) { return formatCurrency(n); }

  daysLabel(days: number[]): string { return days.map(d => DAYS[d]).join(' · '); }

  toggleDay(i: number) {
    const idx = this.newDays.indexOf(i);
    if (idx >= 0) this.newDays.splice(idx, 1);
    else this.newDays.push(i);
  }

  async addHabit() {
    if (!this.newName.trim()) { this.error = 'Enter a habit name'; return; }
    if (this.newDays.length === 0) { this.error = 'Select at least one day'; return; }
    try {
      await this.api.addHabit(this.newName.trim(), [...this.newDays].sort());
      this.newName = ''; this.newDays = [0, 1, 2, 3, 4, 5, 6]; this.showAdd = false; this.error = '';
      await this.load();
    } catch (err: any) { this.error = err?.error?.error || 'Failed'; }
  }

  async deleteHabit(id: string) {
    await this.api.deactivateHabit(id);
    await this.load();
  }

  dateLabel(d: string): string {
    if (d === this.today) return 'Today';
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (d === yesterday) return 'Yesterday';
    return new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  getDayHabits(date: string): any[] {
    const d = new Date(date);
    const dayIdx = d.getDay() === 0 ? 6 : d.getDay() - 1;
    return this.habits.filter(h => h.days.includes(dayIdx));
  }

  getStatus(habit: any, date: string): string {
    const log = this.habitLogs.find(l => l.habit_id === habit.id && l.date === date);
    return log?.status ?? (date < this.today ? 'missed' : 'pending');
  }

  getBadge(habit: any, date: string): string {
    const status = this.getStatus(habit, date);
    if (status === 'done') return `+${formatCurrency(this.allowance * 0.5)}`;
    if (status === 'missed') return `−${formatCurrency(this.allowance * 2)}`;
    return 'Pending';
  }
}
