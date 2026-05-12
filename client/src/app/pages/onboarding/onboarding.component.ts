import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { DAYS, MAX_HABITS } from '../../utils/constants';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './onboarding.component.html',
  styleUrl: './onboarding.component.css'
})
export class OnboardingComponent {
  step = 1;
  allowance = '';
  habits: { name: string; days: number[] }[] = [];
  habitName = '';
  habitDays = [0, 1, 2, 3, 4, 5, 6];
  saving = false;
  error = '';
  DAYS = DAYS;
  MAX_HABITS = MAX_HABITS;

  constructor(private api: ApiService, private router: Router) {}

  daysLabel(days: number[]): string { return days.map(d => DAYS[d]).join(' · '); }

  toggleDay(i: number) {
    const idx = this.habitDays.indexOf(i);
    if (idx >= 0) this.habitDays.splice(idx, 1);
    else this.habitDays.push(i);
  }

  addHabit() {
    if (!this.habitName.trim() || this.habits.length >= MAX_HABITS) return;
    if (this.habitDays.length === 0) { this.error = 'Pick at least one day'; return; }
    this.habits.push({ name: this.habitName.trim(), days: [...this.habitDays].sort() });
    this.habitName = '';
    this.habitDays = [0, 1, 2, 3, 4, 5, 6];
    this.error = '';
  }

  removeHabit(i: number) {
    this.habits.splice(i, 1);
  }

  goToStep2() {
    if (!this.allowance || Number(this.allowance) <= 0) { this.error = 'Enter a valid amount'; return; }
    this.error = '';
    this.step = 2;
  }

  async finish() {
    if (!this.allowance || isNaN(Number(this.allowance)) || Number(this.allowance) <= 0) {
      this.error = 'Enter a valid daily allowance'; return;
    }
    this.saving = true;
    try {
      await this.api.updateSettings(Number(this.allowance));
      if (this.habits.length > 0) {
        await this.api.addHabitsBulk(this.habits);
      }
      this.router.navigate(['/']);
    } catch (err: any) {
      this.error = err?.error?.error || err?.message || 'Something went wrong';
    } finally {
      this.saving = false;
    }
  }
}
