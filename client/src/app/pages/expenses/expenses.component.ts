import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { currentMonthStr, formatCurrency } from '../../utils/constants';

@Component({
  selector: 'app-expenses',
  standalone: true,
  templateUrl: './expenses.component.html',
  styleUrl: './expenses.component.css'
})
export class ExpensesComponent implements OnInit {
  expenses: any[] = [];
  loading = true;
  groups: { date: string; label: string; total: number; items: any[] }[] = [];

  constructor(private api: ApiService) {}

  async ngOnInit() {
    const month = currentMonthStr();
    this.expenses = await this.api.getExpenses(month + '-01') || [];
    this.buildGroups();
    this.loading = false;
  }

  get monthLabel() {
    return new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  }

  fmt(n: number) { return formatCurrency(n); }

  buildGroups() {
    const map: Record<string, any[]> = {};
    for (const e of this.expenses) {
      const date = e.logged_at.split('T')[0];
      if (!map[date]) map[date] = [];
      map[date].push(e);
    }
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    this.groups = Object.keys(map).sort((a, b) => b.localeCompare(a)).map(date => ({
      date,
      label: date === today ? 'Today' : date === yesterday ? 'Yesterday' : new Date(date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
      total: map[date].reduce((s: number, e: any) => s + e.amount, 0),
      items: map[date]
    }));
  }

  getTime(e: any): string {
    return new Date(e.logged_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  }

  getModeColor(mode: string): string {
    const map: Record<string, string> = { 'Account': 'var(--accent)', 'Cash': 'var(--green)', 'Credit Card': 'var(--amber)' };
    return map[mode] ?? 'var(--text-faint)';
  }

  exportCSV() {
    const headers = ['Date', 'Time', 'Description', 'Category', 'Amount', 'Payment Mode'];
    const rows = this.expenses.map(e => {
      const dt = new Date(e.logged_at);
      const date = dt.toLocaleDateString('en-IN');
      const time = dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
      return [date, time, e.description, e.category, e.amount, e.payment_mode].map(v => `"${v}"`).join(',');
    });
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const month = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }).replace(' ', '_');
    a.href = url;
    a.download = `DailyStack_${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
