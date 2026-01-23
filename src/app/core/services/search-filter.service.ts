import { Injectable } from '@angular/core';
import { Expense } from '../models/expense.model';

export interface FilterCriteria {
  keyword?: string;
  startDate?: Date;
  endDate?: Date;
  categories?: string[];
  paymentMethods?: string[];
  members?: string[];
  minAmount?: number;
  maxAmount?: number;
  currencies?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class SearchFilterService {

  /**
   * 應用篩選條件到支出列表
   */
  applyFilters(expenses: Expense[], criteria: FilterCriteria): Expense[] {
    let filtered = [...expenses];

    // 關鍵字篩選
    if (criteria.keyword && criteria.keyword.trim()) {
      const keyword = criteria.keyword.toLowerCase();
      filtered = filtered.filter(expense =>
        expense.item.toLowerCase().includes(keyword) ||
        expense.category.toLowerCase().includes(keyword) ||
        expense.paymentMethod.toLowerCase().includes(keyword) ||
        (expense.note && expense.note.toLowerCase().includes(keyword)) ||
        expense.submittedByName.toLowerCase().includes(keyword)
      );
    }

    // 日期範圍篩選
    if (criteria.startDate) {
      filtered = filtered.filter(expense => {
        const expenseDate = expense.expenseDate.toDate();
        const startDate = new Date(criteria.startDate!);
        startDate.setHours(0, 0, 0, 0);
        return expenseDate >= startDate;
      });
    }

    if (criteria.endDate) {
      filtered = filtered.filter(expense => {
        const expenseDate = expense.expenseDate.toDate();
        const endDate = new Date(criteria.endDate!);
        endDate.setHours(23, 59, 59, 999);
        return expenseDate <= endDate;
      });
    }

    // 分類篩選
    if (criteria.categories && criteria.categories.length > 0) {
      filtered = filtered.filter(expense =>
        criteria.categories!.includes(expense.category)
      );
    }

    // 支付方式篩選
    if (criteria.paymentMethods && criteria.paymentMethods.length > 0) {
      filtered = filtered.filter(expense =>
        criteria.paymentMethods!.includes(expense.paymentMethod)
      );
    }

    // 成員篩選
    if (criteria.members && criteria.members.length > 0) {
      filtered = filtered.filter(expense =>
        criteria.members!.includes(expense.submittedBy)
      );
    }

    // 金額範圍篩選（以 TWD 為基準）
    if (criteria.minAmount !== undefined) {
      filtered = filtered.filter(expense =>
        expense.amountInTWD >= criteria.minAmount!
      );
    }

    if (criteria.maxAmount !== undefined) {
      filtered = filtered.filter(expense =>
        expense.amountInTWD <= criteria.maxAmount!
      );
    }

    // 幣別篩選
    if (criteria.currencies && criteria.currencies.length > 0) {
      filtered = filtered.filter(expense =>
        criteria.currencies!.includes(expense.currency)
      );
    }

    return filtered;
  }

  /**
   * 檢查是否有活躍的篩選條件
   */
  hasActiveFilters(criteria: FilterCriteria): boolean {
    return !!(
      (criteria.keyword && criteria.keyword.trim().length > 0) ||
      criteria.startDate ||
      criteria.endDate ||
      (criteria.categories && criteria.categories.length > 0) ||
      (criteria.paymentMethods && criteria.paymentMethods.length > 0) ||
      (criteria.members && criteria.members.length > 0) ||
      criteria.minAmount !== undefined ||
      criteria.maxAmount !== undefined ||
      (criteria.currencies && criteria.currencies.length > 0)
    );
  }

  /**
   * 計算篩選統計
   */
  getFilterStats(expenses: Expense[], filtered: Expense[]): {
    totalExpenses: number;
    filteredExpenses: number;
    totalAmount: number;
    filteredAmount: number;
  } {
    const totalAmount = expenses.reduce((sum, e) => sum + e.amountInTWD, 0);
    const filteredAmount = filtered.reduce((sum, e) => sum + e.amountInTWD, 0);

    return {
      totalExpenses: expenses.length,
      filteredExpenses: filtered.length,
      totalAmount: Math.round(totalAmount * 100) / 100,
      filteredAmount: Math.round(filteredAmount * 100) / 100
    };
  }

  /**
   * 重置篩選條件
   */
  resetFilters(): FilterCriteria {
    return {
      keyword: '',
      startDate: undefined,
      endDate: undefined,
      categories: [],
      paymentMethods: [],
      members: [],
      minAmount: undefined,
      maxAmount: undefined,
      currencies: []
    };
  }

  /**
   * 排序支出列表
   */
  sortExpenses(
    expenses: Expense[],
    sortBy: 'date' | 'amount' | 'category' = 'date',
    order: 'asc' | 'desc' = 'desc'
  ): Expense[] {
    const sorted = [...expenses];

    switch (sortBy) {
      case 'date':
        sorted.sort((a, b) => {
          const dateA = a.expenseDate.toDate().getTime();
          const dateB = b.expenseDate.toDate().getTime();
          return order === 'desc' ? dateB - dateA : dateA - dateB;
        });
        break;

      case 'amount':
        sorted.sort((a, b) => {
          const amountA = a.amountInTWD;
          const amountB = b.amountInTWD;
          return order === 'desc' ? amountB - amountA : amountA - amountB;
        });
        break;

      case 'category':
        sorted.sort((a, b) => {
          const categoryA = a.category.toLowerCase();
          const categoryB = b.category.toLowerCase();
          if (order === 'desc') {
            return categoryB.localeCompare(categoryA);
          } else {
            return categoryA.localeCompare(categoryB);
          }
        });
        break;
    }

    return sorted;
  }
}
