import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { formatCurrency } from '../../utils/constants';

@Component({
  selector: 'app-archive',
  standalone: true,
  templateUrl: './archive.component.html',
  styleUrl: './archive.component.css'
})
export class ArchiveComponent implements OnInit {
  archives: any[] = [];
  loading = true;

  constructor(private api: ApiService) {}

  async ngOnInit() {
    this.archives = await this.api.getArchives() || [];
    this.loading = false;
  }

  fmt(n: number) { return formatCurrency(n); }

  getMonthLabel(month: string): string {
    const [year, m] = month.split('-');
    return new Date(Number(year), Number(m) - 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  }
}
