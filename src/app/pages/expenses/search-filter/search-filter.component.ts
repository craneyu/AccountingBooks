import { Component, Input, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchFilterService, FilterCriteria } from '../../../core/services/search-filter.service';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faTimes, faFilter, faRotateLeft } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-search-filter',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule],
  templateUrl: './search-filter.component.html',
  styleUrl: './search-filter.component.scss'
})
export class SearchFilterComponent implements OnInit {
  @Input() categories: string[] = [];
  @Input() paymentMethods: string[] = [];
  @Input() members: Array<{ id: string; name: string }> = [];
  @Input() currencies: string[] = [];
  @Output() filterApplied = new EventEmitter<FilterCriteria>();
  @Output() filterReset = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  private searchFilterService = inject(SearchFilterService);

  // 篩選條件
  criteria: FilterCriteria = this.searchFilterService.resetFilters();

  // UI 狀態
  selectedCategories: string[] = [];
  selectedPaymentMethods: string[] = [];
  selectedMembers: string[] = [];
  selectedCurrencies: string[] = [];

  // 展開狀態
  expandedSections: Record<string, boolean> = {
    keyword: true,
    dateRange: false,
    categories: false,
    paymentMethods: false,
    members: false,
    amount: false,
    currencies: false
  };

  faTimes = faTimes;
  faFilter = faFilter;
  faRotateLeft = faRotateLeft;

  ngOnInit() {
    // 初始化選項
    this.loadDefaultValues();
  }

  private loadDefaultValues() {
    // 根據傳入的數據初始化篩選選項
  }

  toggleSection(section: string) {
    this.expandedSections[section] = !this.expandedSections[section];
  }

  toggleCategory(category: string) {
    const index = this.selectedCategories.indexOf(category);
    if (index > -1) {
      this.selectedCategories.splice(index, 1);
    } else {
      this.selectedCategories.push(category);
    }
    this.criteria.categories = this.selectedCategories.length > 0 ? [...this.selectedCategories] : [];
  }

  togglePaymentMethod(method: string) {
    const index = this.selectedPaymentMethods.indexOf(method);
    if (index > -1) {
      this.selectedPaymentMethods.splice(index, 1);
    } else {
      this.selectedPaymentMethods.push(method);
    }
    this.criteria.paymentMethods = this.selectedPaymentMethods.length > 0 ? [...this.selectedPaymentMethods] : [];
  }

  toggleMember(memberId: string) {
    const index = this.selectedMembers.indexOf(memberId);
    if (index > -1) {
      this.selectedMembers.splice(index, 1);
    } else {
      this.selectedMembers.push(memberId);
    }
    this.criteria.members = this.selectedMembers.length > 0 ? [...this.selectedMembers] : [];
  }

  toggleCurrency(currency: string) {
    const index = this.selectedCurrencies.indexOf(currency);
    if (index > -1) {
      this.selectedCurrencies.splice(index, 1);
    } else {
      this.selectedCurrencies.push(currency);
    }
    this.criteria.currencies = this.selectedCurrencies.length > 0 ? [...this.selectedCurrencies] : [];
  }

  applyFilters() {
    this.filterApplied.emit(this.criteria);
  }

  resetFilters() {
    this.criteria = this.searchFilterService.resetFilters();
    this.selectedCategories = [];
    this.selectedPaymentMethods = [];
    this.selectedMembers = [];
    this.selectedCurrencies = [];
    this.filterReset.emit();
  }

  closePanel() {
    this.close.emit();
  }

  getMemberName(memberId: string): string {
    return this.members.find(m => m.id === memberId)?.name || memberId;
  }

  hasActiveFilters(): boolean {
    return this.searchFilterService.hasActiveFilters(this.criteria);
  }

  clearKeyword() {
    this.criteria.keyword = '';
  }

  clearDateRange() {
    this.criteria.startDate = undefined;
    this.criteria.endDate = undefined;
  }

  clearAmount() {
    this.criteria.minAmount = undefined;
    this.criteria.maxAmount = undefined;
  }
}
