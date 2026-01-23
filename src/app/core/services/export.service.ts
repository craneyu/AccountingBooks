import { Injectable } from '@angular/core';
import { Expense } from '../models/expense.model';
import { Trip } from '../models/trip.model';
import JSZip from 'jszip';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';

export interface ExportOptions {
  includeBOM?: boolean;
  includeImages?: boolean;
  dateFormat?: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';
}

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  /**
   * 生成 CSV 資料（UTF-8 with BOM）
   */
  generateCSV(expenses: Expense[], options: ExportOptions = {}): string {
    const {
      includeBOM = true,
      dateFormat = 'YYYY-MM-DD'
    } = options;

    if (expenses.length === 0) {
      return includeBOM ? '\uFEFF' : '';
    }

    // 定義欄位
    const headers = [
      '日期',
      '項目',
      '分類',
      '金額',
      '幣別',
      '匯率',
      '台幣金額',
      '支付方式',
      '備註',
      '提交者'
    ];

    // 轉換資料
    const data = expenses.map(expense => [
      this.formatDate(expense.expenseDate.toDate(), dateFormat),
      expense.item,
      expense.category,
      expense.amount.toFixed(2),
      expense.currency,
      expense.exchangeRate.toFixed(4),
      expense.amountInTWD.toFixed(2),
      expense.paymentMethod,
      expense.note || '',
      expense.isDeletedUser ? '已註銷使用者' : expense.submittedByName
    ]);

    // 使用 papaparse 生成 CSV
    const csv = Papa.unparse({
      fields: headers,
      data: data
    });

    // 加入 BOM（UTF-8）
    return includeBOM ? '\uFEFF' + csv : csv;
  }

  /**
   * 匯出為 CSV 檔案
   */
  exportAsCSV(expenses: Expense[], tripName: string, options: ExportOptions = {}): void {
    const csv = this.generateCSV(expenses, options);
    const filename = this.generateFilename(tripName, 'csv');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, filename);
  }

  /**
   * 匯出為 ZIP 檔案（CSV + 圖片）
   */
  async exportAsZIP(
    expenses: Expense[],
    trip: Trip,
    options: ExportOptions = {}
  ): Promise<void> {
    const { includeImages = true } = options;

    const zip = new JSZip();

    // 1. 新增 CSV
    const csv = this.generateCSV(expenses, options);
    zip.file('expenses.csv', csv);

    // 2. 新增圖片
    if (includeImages) {
      const imagesFolder = zip.folder('receipts');
      if (imagesFolder) {
        let imageIndex = 1;

        for (const expense of expenses) {
          const imageUrls = expense.receiptImageUrls || (expense.receiptImageUrl ? [expense.receiptImageUrl] : []);

          for (let i = 0; i < imageUrls.length; i++) {
            const url = imageUrls[i];
            if (!url) continue;

            try {
              const blob = await this.fetchImageAsBlob(url);
              if (blob) {
                const filename = `${expense.id}_${i + 1}.jpg`;
                imagesFolder.file(filename, blob);
              }
            } catch (error) {
              console.warn(`無法下載圖片: ${url}`, error);
            }

            imageIndex++;
          }
        }
      }
    }

    // 3. 新增元數據
    const metadata = {
      tripName: trip.name,
      startDate: trip.startDate.toDate().toISOString().split('T')[0],
      endDate: trip.endDate.toDate().toISOString().split('T')[0],
      currency: trip.currency,
      expenseCount: expenses.length,
      totalAmount: expenses.reduce((sum, e) => sum + e.amountInTWD, 0),
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    zip.file('metadata.json', JSON.stringify(metadata, null, 2));

    // 4. 生成並下載 ZIP
    const blob = await zip.generateAsync({ type: 'blob' });
    const filename = this.generateFilename(trip.name, 'zip');
    saveAs(blob, filename);
  }

  /**
   * 下載圖片為 Blob
   */
  private async fetchImageAsBlob(url: string): Promise<Blob | null> {
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      return await response.blob();
    } catch (error) {
      console.error(`Failed to fetch image: ${url}`, error);
      return null;
    }
  }

  /**
   * 格式化日期
   */
  private formatDate(date: Date, format: string): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    switch (format) {
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'YYYY-MM-DD':
      default:
        return `${year}-${month}-${day}`;
    }
  }

  /**
   * 生成檔案名稱
   */
  private generateFilename(tripName: string, type: 'csv' | 'zip'): string {
    const sanitizedName = tripName.replace(/[^a-zA-Z0-9_\-]/g, '_');
    const date = new Date().toISOString().split('T')[0];
    const ext = type === 'csv' ? 'csv' : 'zip';

    if (type === 'csv') {
      return `${sanitizedName}_支出紀錄_${date}.${ext}`;
    } else {
      return `${sanitizedName}_完整資料_${date}.${ext}`;
    }
  }

  /**
   * 計算匯出統計
   */
  getExportStats(expenses: Expense[]): {
    totalExpenses: number;
    totalImages: number;
    totalSize: number;
    csvSize: number;
  } {
    const totalExpenses = expenses.length;
    const totalImages = expenses.reduce((sum, e) => {
      const urls = e.receiptImageUrls || (e.receiptImageUrl ? [e.receiptImageUrl] : []);
      return sum + urls.length;
    }, 0);

    const csv = this.generateCSV(expenses);
    const csvSize = new Blob([csv]).size;

    // 估計總大小（CSV + 圖片）
    // 假設平均每張圖片 500KB
    const estimatedImageSize = totalImages * 500 * 1024;
    const totalSize = csvSize + estimatedImageSize;

    return {
      totalExpenses,
      totalImages,
      totalSize,
      csvSize
    };
  }
}
