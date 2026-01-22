import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TripService } from '../../../core/services/trip.service';
import { ExpenseService } from '../../../core/services/expense.service';
import { CategoryService } from '../../../core/services/category.service';
import { Trip } from '../../../core/models/trip.model';
import { Expense } from '../../../core/models/expense.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { 
  faChartPie, faArrowLeft, faCalendarDay, faCreditCard, faWallet, faMobileAlt, faCoins, faTag
} from '@fortawesome/free-solid-svg-icons';
import { getIcon } from '../../../core/utils/icon-utils';
import { Observable } from 'rxjs';

interface StatItem {
  name: string;
  amount: number;
  percentage: number;
  icon?: any;
  color?: string;
}

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FontAwesomeModule],
  templateUrl: './statistics.html',
  styleUrl: './statistics.scss'
})
export class StatisticsComponent implements OnInit {
  private tripService = inject(TripService);
  private expenseService = inject(ExpenseService);
  private categoryService = inject(CategoryService);

  trips$: Observable<Trip[]> = this.tripService.getAllTrips();
  selectedTripId = signal<string>('');
  
  expenses = signal<Expense[]>([]);
  loading = signal(false);
  
  // Category Map for Icons
  categoryIconMap = signal<Record<string, string>>({});

  // Icons
  faChartPie = faChartPie;
  faArrowLeft = faArrowLeft;
  faCalendarDay = faCalendarDay;
  faCreditCard = faCreditCard;

  constructor() {
    this.categoryService.getCategories().subscribe(cats => {
      const map: Record<string, string> = {};
      cats.forEach(c => {
        if (c.icon) map[c.name] = c.icon;
      });
      this.categoryIconMap.set(map);
    });
  }

  // Computed Stats
  totalTWD = computed(() => {
    return this.expenses().reduce((sum, e) => sum + (e.amountInTWD || 0), 0);
  });

  categoryStats = computed<StatItem[]>(() => {
    const map = new Map<string, number>();
    this.expenses().forEach(e => {
      const cat = e.category || '其他';
      map.set(cat, (map.get(cat) || 0) + (e.amountInTWD || 0));
    });

    const total = this.totalTWD() || 1;
    return Array.from(map.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: (amount / total) * 100,
        icon: this.getCategoryIcon(name)
      }))
      .sort((a, b) => b.amount - a.amount);
  });

  paymentStats = computed<StatItem[]>(() => {
    const map = new Map<string, number>();
    this.expenses().forEach(e => {
      const method = e.paymentMethod || '其他';
      map.set(method, (map.get(method) || 0) + (e.amountInTWD || 0));
    });

    const total = this.totalTWD() || 1;
    return Array.from(map.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: (amount / total) * 100,
        icon: this.getPaymentIcon(name)
      }))
      .sort((a, b) => b.amount - a.amount);
  });

  dailyStats = computed<StatItem[]>(() => {
    const map = new Map<string, number>();
    this.expenses().forEach(e => {
      const date = e.expenseDate.toDate().toISOString().substring(0, 10);
      map.set(date, (map.get(date) || 0) + (e.amountInTWD || 0));
    });

    return Array.from(map.entries())
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: 0 
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  });

  ngOnInit() {
    this.trips$.subscribe(trips => {
      if (trips.length > 0 && !this.selectedTripId()) {
        this.onTripChange(trips[0].id!);
      }
    });
  }

  onTripChange(tripId: string) {
    if (!tripId) {
      this.expenses.set([]);
      return;
    }
    this.selectedTripId.set(tripId);
    this.loading.set(true);
    this.expenseService.getExpenses(tripId).subscribe({
      next: (data) => {
        this.expenses.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  getCategoryIcon(categoryName: string) {
    const iconName = this.categoryIconMap()[categoryName];
    return getIcon(iconName);
  }

  getPaymentIcon(method: string) {
    switch (method) {
      case '現金': return faCoins;
      case '信用卡': return faCreditCard;
      case '行動支付': return faMobileAlt;
      default: return faWallet;
    }
  }
}
