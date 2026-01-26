import { Component, Input, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { Expense } from '../../../core/models/expense.model';
import { StatisticsService } from '../../../core/services/statistics.service';
import { CurrencyService } from '../../../core/services/currency.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faChartPie, faChartLine, faChartBar } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective, FontAwesomeModule],
  templateUrl: './statistics.component.html',
  styleUrl: './statistics.component.scss'
})
export class StatisticsComponent implements OnInit {
  private _expenses = signal<Expense[]>([]);
  @Input()
  set expenses(value: Expense[]) {
    this._expenses.set(value);
  }
  get expenses(): Expense[] {
    return this._expenses();
  }

  private statisticsService = inject(StatisticsService);
  private currencyService = inject(CurrencyService);

  selectedCurrency = signal('TWD');
  currencies = signal<string[]>(['TWD', 'USD', 'JPY', 'EUR', 'KRW', 'CNY', 'THB', 'GBP']);

  // Chart data signals
  categoryStats = computed(() => this.statisticsService.calculateCategoryStats(this._expenses(), this.selectedCurrency()));
  dailyTrend = computed(() => this.statisticsService.calculateDailyTrend(this._expenses(), this.selectedCurrency()));
  memberStats = computed(() => this.statisticsService.calculateMemberStats(this._expenses(), this.selectedCurrency()));
  paymentMethodStats = computed(() => this.statisticsService.calculatePaymentMethodStats(this._expenses(), this.selectedCurrency()));
  summary = computed(() => this.statisticsService.calculateSummary(this._expenses(), this.selectedCurrency()));

  // Chart configurations
  categoryChartData = computed(() => this.buildCategoryChartData());
  dailyTrendChartData = computed(() => this.buildDailyTrendChartData());
  memberChartData = computed(() => this.buildMemberChartData());
  paymentMethodChartData = computed(() => this.buildPaymentMethodChartData());

  faChartPie = faChartPie;
  faChartLine = faChartLine;
  faChartBar = faChartBar;

  // Chart options
  pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 15
        }
      }
    }
  };

  lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top'
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  ngOnInit() {
    // 載入自訂幣別
    this.currencyService.getCurrencies().subscribe(currencies => {
      const currencyCodes = currencies.map(c => c.id);
      const allCurrencies = new Set([...this.currencies(), ...currencyCodes]);
      this.currencies.set(Array.from(allCurrencies));
    });
  }

  private buildCategoryChartData(): ChartConfiguration['data'] {
    const stats = this.categoryStats();
    return {
      labels: stats.map(s => s.category),
      datasets: [
        {
          data: stats.map(s => Math.round(s.amount * 100) / 100),
          backgroundColor: this.generateColors(stats.length),
          borderColor: '#fff',
          borderWidth: 2
        }
      ]
    };
  }

  private buildDailyTrendChartData(): ChartConfiguration['data'] {
    const trend = this.dailyTrend();
    return {
      labels: trend.map(t => t.date),
      datasets: [
        {
          label: '每日支出',
          data: trend.map(t => Math.round(t.amount * 100) / 100),
          borderColor: '#4fd1c5',
          backgroundColor: 'rgba(79, 209, 197, 0.1)',
          fill: true,
          tension: 0.3,
          borderWidth: 2
        }
      ]
    };
  }

  private buildMemberChartData(): ChartConfiguration['data'] {
    const stats = this.memberStats();
    return {
      labels: stats.map(s => s.memberName),
      datasets: [
        {
          label: '個人支出',
          data: stats.map(s => Math.round(s.amount * 100) / 100),
          backgroundColor: '#4fd1c5',
          borderColor: '#2d9b8d',
          borderWidth: 1
        }
      ]
    };
  }

  private buildPaymentMethodChartData(): ChartConfiguration['data'] {
    const stats = this.paymentMethodStats();
    return {
      labels: stats.map(s => s.paymentMethod),
      datasets: [
        {
          label: '支付方式',
          data: stats.map(s => Math.round(s.amount * 100) / 100),
          backgroundColor: ['#4fd1c5', '#a8e6e1', '#3fc0b5', '#2d9b8d', '#1a7070'],
          borderColor: '#fff',
          borderWidth: 1
        }
      ]
    };
  }

  private generateColors(count: number): string[] {
    const baseColors = [
      '#4fd1c5', '#a8e6e1', '#3fc0b5', '#2d9b8d', '#1a7070',
      '#6ce5db', '#2caaa2', '#0d8882', '#4fd1c5', '#a8e6e1'
    ];
    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
  }

  onCurrencyChange() {
    // Signals will automatically trigger updates to chart data
  }
}
