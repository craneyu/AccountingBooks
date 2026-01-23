import { Injectable } from '@angular/core';
import { Expense } from '../models/expense.model';

export interface CategoryStats {
  category: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface DailyTrend {
  date: string;
  amount: number;
  count: number;
}

export interface MemberStats {
  memberId: string;
  memberName: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface PaymentMethodStats {
  paymentMethod: string;
  amount: number;
  percentage: number;
  count: number;
}

export interface CurrencyConversion {
  currency: string;
  amount: number;
  convertedAmount: number;
}

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {

  /**
   * 計算支出分類統計
   */
  calculateCategoryStats(expenses: Expense[], targetCurrency: string = 'TWD'): CategoryStats[] {
    const categoryMap = new Map<string, { amount: number; count: number }>();

    expenses.forEach(expense => {
      const amount = targetCurrency === 'TWD' ? expense.amountInTWD : this.convertAmount(expense, targetCurrency);
      const existing = categoryMap.get(expense.category) || { amount: 0, count: 0 };
      categoryMap.set(expense.category, {
        amount: existing.amount + amount,
        count: existing.count + 1
      });
    });

    const total = Array.from(categoryMap.values()).reduce((sum, item) => sum + item.amount, 0);

    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({
        category,
        amount: Math.round(data.amount * 100) / 100,
        percentage: total > 0 ? Math.round((data.amount / total) * 100) : 0,
        count: data.count
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  /**
   * 計算每日支出趨勢
   */
  calculateDailyTrend(expenses: Expense[], targetCurrency: string = 'TWD'): DailyTrend[] {
    const dailyMap = new Map<string, { amount: number; count: number }>();

    expenses.forEach(expense => {
      const dateStr = expense.expenseDate.toDate().toISOString().split('T')[0];
      const amount = targetCurrency === 'TWD' ? expense.amountInTWD : this.convertAmount(expense, targetCurrency);
      const existing = dailyMap.get(dateStr) || { amount: 0, count: 0 };
      dailyMap.set(dateStr, {
        amount: existing.amount + amount,
        count: existing.count + 1
      });
    });

    return Array.from(dailyMap.entries())
      .map(([date, data]) => ({
        date,
        amount: Math.round(data.amount * 100) / 100,
        count: data.count
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * 計算成員支出統計
   */
  calculateMemberStats(expenses: Expense[], targetCurrency: string = 'TWD'): MemberStats[] {
    const memberMap = new Map<string, { name: string; amount: number; count: number }>();

    expenses.forEach(expense => {
      const memberId = expense.submittedBy;
      const memberName = expense.submittedByName || 'Unknown';
      const amount = targetCurrency === 'TWD' ? expense.amountInTWD : this.convertAmount(expense, targetCurrency);

      const existing = memberMap.get(memberId) || { name: memberName, amount: 0, count: 0 };
      memberMap.set(memberId, {
        name: existing.name || memberName,
        amount: existing.amount + amount,
        count: existing.count + 1
      });
    });

    const total = Array.from(memberMap.values()).reduce((sum, item) => sum + item.amount, 0);

    return Array.from(memberMap.entries())
      .map(([memberId, data]) => ({
        memberId,
        memberName: data.name,
        amount: Math.round(data.amount * 100) / 100,
        percentage: total > 0 ? Math.round((data.amount / total) * 100) : 0,
        count: data.count
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  /**
   * 計算支出方式統計
   */
  calculatePaymentMethodStats(expenses: Expense[], targetCurrency: string = 'TWD'): PaymentMethodStats[] {
    const methodMap = new Map<string, { amount: number; count: number }>();

    expenses.forEach(expense => {
      const amount = targetCurrency === 'TWD' ? expense.amountInTWD : this.convertAmount(expense, targetCurrency);
      const existing = methodMap.get(expense.paymentMethod) || { amount: 0, count: 0 };
      methodMap.set(expense.paymentMethod, {
        amount: existing.amount + amount,
        count: existing.count + 1
      });
    });

    const total = Array.from(methodMap.values()).reduce((sum, item) => sum + item.amount, 0);

    return Array.from(methodMap.entries())
      .map(([paymentMethod, data]) => ({
        paymentMethod,
        amount: Math.round(data.amount * 100) / 100,
        percentage: total > 0 ? Math.round((data.amount / total) * 100) : 0,
        count: data.count
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  /**
   * 計算支出統計摘要
   */
  calculateSummary(expenses: Expense[], targetCurrency: string = 'TWD'): {
    totalAmount: number;
    totalCount: number;
    averageAmount: number;
    maxAmount: number;
    minAmount: number;
  } {
    if (expenses.length === 0) {
      return { totalAmount: 0, totalCount: 0, averageAmount: 0, maxAmount: 0, minAmount: 0 };
    }

    const amounts = expenses.map(expense =>
      targetCurrency === 'TWD' ? expense.amountInTWD : this.convertAmount(expense, targetCurrency)
    );

    const total = amounts.reduce((sum, amount) => sum + amount, 0);

    return {
      totalAmount: Math.round(total * 100) / 100,
      totalCount: expenses.length,
      averageAmount: Math.round((total / expenses.length) * 100) / 100,
      maxAmount: Math.max(...amounts),
      minAmount: Math.min(...amounts)
    };
  }

  /**
   * 貨幣轉換（暫時使用簡化邏輯，實際需要匯率）
   * 注意：此方法需要整合 ExchangeRateService 來取得正確匯率
   */
  private convertAmount(expense: Expense, targetCurrency: string): number {
    if (expense.currency === targetCurrency) {
      return expense.amountInTWD;
    }

    // 簡化邏輯：如果目標幣別不是 TWD，返回原始金額
    // 實際應該使用匯率進行轉換
    if (targetCurrency === 'TWD') {
      return expense.amountInTWD;
    }

    // 對於其他幣別，暫時返回原始金額（未實現完整轉換）
    return expense.amount;
  }

  /**
   * 按日期篩選支出
   */
  filterByDateRange(expenses: Expense[], startDate: Date, endDate: Date): Expense[] {
    return expenses.filter(expense => {
      const expenseDate = expense.expenseDate.toDate();
      return expenseDate >= startDate && expenseDate <= endDate;
    });
  }

  /**
   * 按分類篩選支出
   */
  filterByCategory(expenses: Expense[], category: string): Expense[] {
    return expenses.filter(expense => expense.category === category);
  }

  /**
   * 按支付方式篩選支出
   */
  filterByPaymentMethod(expenses: Expense[], paymentMethod: string): Expense[] {
    return expenses.filter(expense => expense.paymentMethod === paymentMethod);
  }

  /**
   * 按金額範圍篩選支出
   */
  filterByAmountRange(expenses: Expense[], minAmount: number, maxAmount: number, targetCurrency: string = 'TWD'): Expense[] {
    return expenses.filter(expense => {
      const amount = targetCurrency === 'TWD' ? expense.amountInTWD : this.convertAmount(expense, targetCurrency);
      return amount >= minAmount && amount <= maxAmount;
    });
  }

  /**
   * 按成員篩選支出
   */
  filterByMember(expenses: Expense[], memberId: string): Expense[] {
    return expenses.filter(expense => expense.submittedBy === memberId);
  }

  /**
   * 取得唯一的分類列表
   */
  getUniqueCategoriesFromExpenses(expenses: Expense[]): string[] {
    return Array.from(new Set(expenses.map(e => e.category)));
  }

  /**
   * 取得唯一的支付方式列表
   */
  getUniquePaymentMethodsFromExpenses(expenses: Expense[]): string[] {
    return Array.from(new Set(expenses.map(e => e.paymentMethod)));
  }

  /**
   * 取得唯一的成員列表
   */
  getUniqueMembersFromExpenses(expenses: Expense[]): Array<{ id: string; name: string }> {
    const memberMap = new Map<string, string>();
    expenses.forEach(expense => {
      if (!memberMap.has(expense.submittedBy)) {
        memberMap.set(expense.submittedBy, expense.submittedByName);
      }
    });
    return Array.from(memberMap.entries()).map(([id, name]) => ({ id, name }));
  }
}
