import { Injectable, inject, signal } from '@angular/core';
import { Firestore, collectionData, docData } from '@angular/fire/firestore';
import {
  collection,
  query,
  where,
  orderBy,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  Timestamp,
  getDocs,
  setDoc
} from 'firebase/firestore';
import { Currency, DEFAULT_CURRENCIES } from '../models/currency.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CurrencyService {
  private firestore = inject(Firestore);
  private currenciesCache = signal<Currency[]>([]);
  private initialized = signal(false);

  constructor() {
    this.initializeCurrencies();
  }

  /**
   * 初始化系統幣別（如果不存在）
   */
  private async initializeCurrencies(): Promise<void> {
    try {
      const currenciesRef = collection(this.firestore, 'currencies');
      const snapshot = await getDocs(currenciesRef);

      // 如果沒有幣別，建立預設幣別
      if (snapshot.empty) {
        await this.createDefaultCurrencies();
      }

      // 加載所有幣別到快取
      this.loadCurrencies();
    } catch (error) {
      console.error('初始化幣別失敗:', error);
      this.initialized.set(true);
    }
  }

  /**
   * 建立系統預設幣別
   */
  private async createDefaultCurrencies(): Promise<void> {
    try {
      const batch = writeBatch(this.firestore);
      const now = Timestamp.now();

      DEFAULT_CURRENCIES.forEach((currency) => {
        const docRef = doc(this.firestore, 'currencies', currency.id);
        batch.set(docRef, {
          ...currency,
          createdAt: now,
          updatedAt: now
        });
      });

      await batch.commit();
      console.log('系統預設幣別已建立');
    } catch (error) {
      console.error('建立預設幣別失敗:', error);
    }
  }

  /**
   * 加載所有幣別（可訂閱）
   */
  getCurrencies(): Observable<Currency[]> {
    const currenciesRef = collection(this.firestore, 'currencies');
    const q = query(
      currenciesRef,
      where('isActive', '==', true),
      orderBy('order', 'asc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Currency[]>;
  }

  /**
   * 取得單個幣別
   */
  getCurrency(id: string): Observable<Currency | undefined> {
    const docRef = doc(this.firestore, 'currencies', id);
    return docData(docRef, { idField: 'id' }) as Observable<Currency>;
  }

  /**
   * 加載幣別到快取
   */
  private loadCurrencies(): void {
    this.getCurrencies().subscribe({
      next: (currencies) => {
        this.currenciesCache.set(currencies);
        this.initialized.set(true);
      },
      error: (error) => {
        console.error('加載幣別失敗:', error);
        this.initialized.set(true);
      }
    });
  }

  /**
   * 取得快取的幣別列表
   */
  getCurrenciesSync(): Currency[] {
    return this.currenciesCache();
  }

  /**
   * 檢查初始化是否完成
   */
  isInitialized(): boolean {
    return this.initialized();
  }

  /**
   * 新增幣別
   */
  async addCurrency(currency: Omit<Currency, 'id' | 'createdAt' | 'updatedAt'>) {
    const currenciesRef = collection(this.firestore, 'currencies');
    return addDoc(currenciesRef, {
      ...currency,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  }

  /**
   * 使用特定 ID 新增幣別
   */
  async addCurrencyWithId(
    id: string,
    currency: Omit<Currency, 'id' | 'createdAt' | 'updatedAt'>
  ) {
    const docRef = doc(this.firestore, 'currencies', id);
    return setDoc(docRef, {
      ...currency,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  }

  /**
   * 更新幣別
   */
  async updateCurrency(id: string, data: Partial<Currency>) {
    const docRef = doc(this.firestore, 'currencies', id);
    return updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now()
    } as any);
  }

  /**
   * 更新幣別排序（批量）
   */
  async updateCurrenciesOrder(currencies: Currency[]): Promise<void> {
    const batch = writeBatch(this.firestore);

    currencies.forEach((currency, index) => {
      const docRef = doc(this.firestore, 'currencies', currency.id);
      batch.update(docRef, {
        order: index,
        updatedAt: Timestamp.now()
      });
    });

    return batch.commit();
  }

  /**
   * 刪除幣別（軟刪除）
   */
  async deleteCurrency(id: string) {
    const docRef = doc(this.firestore, 'currencies', id);
    return updateDoc(docRef, {
      isActive: false,
      updatedAt: Timestamp.now()
    });
  }

  /**
   * 取得預設幣別
   */
  getDefaultCurrency(): Currency | undefined {
    const currencies = this.getCurrenciesSync();
    return currencies.find(c => c.isSystemDefault && c.id === 'TWD');
  }

  /**
   * 檢查幣別是否存在
   */
  async currencyExists(id: string): Promise<boolean> {
    const docRef = doc(this.firestore, 'currencies', id);
    const docSnap = await getDocs(query(collection(this.firestore, 'currencies'), where('id', '==', id)));
    return !docSnap.empty;
  }
}
