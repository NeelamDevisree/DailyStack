import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { currentMonthStr, DAYS, MAX_HABITS } from '../../utils/constants';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, FormsModule],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css'
})
export class ShellComponent implements OnInit {
  showMonthSetup = false;
  allowance = '';
  habits: any[] = [];
  deletedIds: string[] = [];
  habitName = '';
  habitDays = [0, 1, 2, 3, 4, 5, 6];
  saving = false;
  error = '';
  DAYS = DAYS;
  MAX_HABITS = MAX_HABITS;

  navItems = [
    { path: '/', label: 'Dashboard', icon: 'dashboard' },
    { path: '/expenses', label: 'Expenses', icon: 'expenses' },
    { path: '/habits', label: 'Habits', icon: 'habits' },
    { path: '/archive', label: 'Archive', icon: 'archive' }
  ];

  constructor(private api: ApiService, public router: Router) {}

  daysLabel(days: number[]): string { return days.map(d => DAYS[d]).join(' · '); }

  async ngOnInit() {
    const month = currentMonthStr();
    const setup = await this.api.getMonthSetup(month);
    if (!setup) {
      const [settings, habits] = await Promise.all([
        this.api.getSettings(),
        this.api.getHabits()
      ]);
      if (settings) this.allowance = settings.daily_allowance;
      this.habits = habits || [];
      this.showMonthSetup = true;
    }
  }

  get activeHabits() {
    return this.habits.filter(h => !this.deletedIds.includes(h.id));
  }

  get monthLabel() {
    return new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  }

  toggleDay(i: number) {
    const idx = this.habitDays.indexOf(i);
    if (idx >= 0) this.habitDays.splice(idx, 1);
    else this.habitDays.push(i);
  }

  addHabit() {
    if (!this.habitName.trim() || this.activeHabits.length >= MAX_HABITS) return;
    this.habits.push({ id: `new-${Date.now()}`, name: this.habitName.trim(), days: [...this.habitDays].sort(), isNew: true });
    this.habitName = '';
    this.habitDays = [0, 1, 2, 3, 4, 5, 6];
  }

  deleteHabit(id: string) {
    this.deletedIds.push(id);
  }

  async saveMonthSetup() {
    if (!this.allowance || Number(this.allowance) <= 0) { this.error = 'Set a valid daily allowance'; return; }
    this.saving = true;
    try {
      await this.api.updateSettings(Number(this.allowance));
      const realDeleted = this.deletedIds.filter(id => !id.startsWith('new-'));
      if (realDeleted.length) await this.api.deactivateHabitsBulk(realDeleted);
      const newHabits = this.habits.filter(h => h.isNew);
      if (newHabits.length) await this.api.addHabitsBulk(newHabits.map(h => ({ name: h.name, days: h.days })));
      await this.api.createMonthSetup(currentMonthStr());
      this.showMonthSetup = false;
    } catch (err: any) {
      this.error = err?.error?.error || err?.message || 'Something went wrong';
    } finally {
      this.saving = false;
    }
  }

  isActive(path: string): boolean {
    return this.router.url === path;
  }
}
