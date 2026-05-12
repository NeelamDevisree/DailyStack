import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { todayStr, currentMonthStr, getTodayIndex, formatCurrency, DAYS } from '../../utils/constants';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  loading = true;
  data: any = null;
  showLogExpense = false;
  showWithdraw = false;
  showSettings = false;

  // Log expense form
  expDesc = ''; expAmount = ''; expCategory = ''; expPaymentMode = 'Account'; expCategories: string[] = [];
  showAddCat = false; newCat = ''; expSaving = false; expError = '';

  // Withdraw form
  wdAmount = ''; wdSaving = false; wdError = '';

  // Settings form
  stAllowance = ''; stSaving = false; stError = '';
  canChangeAllowance = true; nextChangeDate = '';

  DAYS = DAYS;
  PAYMENT_MODES = ['Account', 'Cash', 'Credit Card'];
  DEFAULT_CATEGORIES = ['Food & Drink','Transport','Groceries','Health','Gym & Fitness','Personal Care','Shopping','Entertainment','Subscriptions','Miscellaneous'];

  constructor(private api: ApiService, private auth: AuthService) {}

  async ngOnInit() { await this.load(); }

  async load() {
    this.loading = true;
    const today = todayStr();
    const month = currentMonthStr();
    const todayIdx = getTodayIndex();

    const [settings, habits, expenses, habitLogs, withdrawals, carry] = await Promise.all([
      this.api.getSettings(),
      this.api.getHabits(),
      this.api.getExpenses(month + '-01'),
      this.api.getHabitLogs(month + '-01'),
      this.api.getWithdrawals(month + '-01'),
      this.api.getCarryOver(),
    ]);

    const allowance = settings?.daily_allowance ?? 0;
    const todayHabits = (habits || []).filter((h: any) => h.days.includes(todayIdx));
    const todayLogs = (habitLogs || []).filter((l: any) => l.date === today);
    const todayExpenses = (expenses || []).filter((e: any) => e.logged_at.startsWith(today));
    const todaySpent = todayExpenses.reduce((s: number, e: any) => s + e.amount, 0);
    const todayBalance = allowance - todaySpent;

    const allDates = [...new Set((expenses || []).map((e: any) => e.logged_at.split('T')[0]))] as string[];
    let dailySavings = 0;
    for (const date of allDates) {
      const daySpent = (expenses || []).filter((e: any) => e.logged_at.startsWith(date)).reduce((s: number, e: any) => s + e.amount, 0);
      dailySavings += allowance - daySpent;
    }
    if (!allDates.includes(today)) dailySavings += allowance;

    let totalRewards = 0;
    const monthDates = [...new Set((habitLogs || []).map((l: any) => l.date))] as string[];
    for (const date of monthDates) {
      const dayLogs = (habitLogs || []).filter((l: any) => l.date === date);
      const dayIdx = new Date(date).getDay();
      const dayHabits = (habits || []).filter((h: any) => h.days.includes(dayIdx === 0 ? 6 : dayIdx - 1));
      for (const habit of dayHabits) {
        const log = dayLogs.find((l: any) => l.habit_id === habit.id);
        if (log?.status === 'done') totalRewards += allowance * 0.5;
        else if (log?.status === 'missed') totalRewards -= allowance * 2;
      }
    }

    const totalWithdrawn = (withdrawals || []).reduce((s: number, w: any) => s + w.amount, 0);
    const totalExpenses = (expenses || []).reduce((s: number, e: any) => s + e.amount, 0);
    const carryOver = carry?.amount ?? 0;
    const totalSavings = carryOver + dailySavings + totalRewards - totalWithdrawn;
    const availableToWithdraw = Math.max(0, totalSavings);

    // Settings lock
    if (settings?.last_changed_at) {
      const next = new Date(new Date(settings.last_changed_at).getTime() + 14 * 86400000);
      this.canChangeAllowance = new Date() >= next;
      this.nextChangeDate = next.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    this.stAllowance = String(allowance);

    this.data = {
      allowance, settings, todayBalance, todaySpent, todayExpenses,
      todayHabits, todayLogs, dailySavings, totalRewards, totalExpenses, totalSavings, availableToWithdraw,
    };
    this.loading = false;
  }

  get monthLabel() {
    return new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  }

  fmt(n: number) { return formatCurrency(n); }

  daysLabel(days: number[]): string { return days.map(d => DAYS[d]).join(' · '); }

  doneCount(): number { return this.data?.todayLogs?.filter((l: any) => l.status === 'done').length ?? 0; }

  get wdAmountNum(): number { return Number(this.wdAmount) || 0; }

  getHabitStatus(habit: any): string {
    const log = this.data.todayLogs.find((l: any) => l.habit_id === habit.id);
    return log?.status ?? 'pending';
  }

  getHabitBadge(habit: any): string {
    const status = this.getHabitStatus(habit);
    if (status === 'done') return `+${formatCurrency(this.data.allowance * 0.5)}`;
    if (status === 'missed') return `−${formatCurrency(this.data.allowance * 2)}`;
    return 'Pending';
  }

  async toggleHabit(habit: any) {
    const log = this.data.todayLogs.find((l: any) => l.habit_id === habit.id);
    const status = log?.status ?? 'pending';
    const today = todayStr();
    if (status === 'pending') {
      await this.api.addHabitLog(habit.id, today, 'done');
    } else if (status === 'done' && log) {
      await this.api.updateHabitLog(log.id, 'missed');
    } else if (status === 'missed' && log) {
      await this.api.deleteHabitLog(log.id);
    }
    await this.load();
  }

  // Log expense
  async openLogExpense() {
    const cats = await this.api.getCategories();
    this.expCategories = [...this.DEFAULT_CATEGORIES, ...(cats || []).map((c: any) => c.name)];
    this.expDesc = ''; this.expAmount = ''; this.expCategory = ''; this.expPaymentMode = 'Account';
    this.expError = ''; this.showAddCat = false; this.newCat = '';
    this.showLogExpense = true;
  }

  async addCategory() {
    if (!this.newCat.trim()) return;
    await this.api.addCategory(this.newCat.trim());
    this.expCategories.push(this.newCat.trim());
    this.expCategory = this.newCat.trim();
    this.newCat = ''; this.showAddCat = false;
  }

  async saveExpense() {
    if (!this.expDesc.trim()) { this.expError = 'Add a description'; return; }
    if (!this.expAmount || isNaN(Number(this.expAmount)) || Number(this.expAmount) <= 0) { this.expError = 'Enter a valid amount'; return; }
    if (!this.expCategory) { this.expError = 'Pick a category'; return; }
    this.expSaving = true;
    try {
      await this.api.addExpense({ description: this.expDesc.trim(), amount: Number(this.expAmount), category: this.expCategory, payment_mode: this.expPaymentMode });
      this.showLogExpense = false;
      await this.load();
    } catch (err: any) { this.expError = err?.error?.error || 'Failed'; }
    finally { this.expSaving = false; }
  }

  // Withdraw
  openWithdraw() {
    this.wdAmount = ''; this.wdError = ''; this.showWithdraw = true;
  }

  get wdRewardsPortion() { return Math.min(Number(this.wdAmount) || 0, Math.max(0, this.data?.totalRewards || 0)); }
  get wdSavingsPortion() { return Math.max(0, (Number(this.wdAmount) || 0) - this.wdRewardsPortion); }

  async saveWithdraw() {
    const n = Number(this.wdAmount);
    if (!n || n <= 0) { this.wdError = 'Enter a valid amount'; return; }
    if (n > this.data.availableToWithdraw) { this.wdError = `Max available: ${formatCurrency(this.data.availableToWithdraw)}`; return; }
    this.wdSaving = true;
    try {
      await this.api.addWithdrawal(n, todayStr());
      this.showWithdraw = false;
      await this.load();
    } catch (err: any) { this.wdError = err?.error?.error || 'Failed'; }
    finally { this.wdSaving = false; }
  }

  // Settings
  openSettings() {
    this.stAllowance = String(this.data.allowance);
    this.stError = '';
    this.showSettings = true;
  }

  async saveSettings() {
    if (!this.canChangeAllowance) return;
    if (!this.stAllowance || isNaN(Number(this.stAllowance)) || Number(this.stAllowance) <= 0) { this.stError = 'Enter a valid amount'; return; }
    this.stSaving = true;
    try {
      await this.api.updateSettings(Number(this.stAllowance));
      this.showSettings = false;
      await this.load();
    } catch (err: any) { this.stError = err?.error?.error || 'Failed'; }
    finally { this.stSaving = false; }
  }

  signOut() { this.auth.signOut(); }

  closeOverlay(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-overlay')) {
      this.showLogExpense = false;
      this.showWithdraw = false;
      this.showSettings = false;
    }
  }

  getExpenseTime(e: any): string {
    return new Date(e.logged_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  statColor(value: number, forceRed = false): string {
    if (forceRed) return 'var(--red)';
    return value > 0 ? 'var(--green)' : value < 0 ? 'var(--red)' : 'var(--text)';
  }

  statDisplay(value: number, forceRed = false): string {
    if (forceRed) return `−${formatCurrency(Math.abs(value))}`;
    return value < 0 ? `−${formatCurrency(Math.abs(value))}` : formatCurrency(value);
  }
}
