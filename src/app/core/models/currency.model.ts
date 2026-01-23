import { Timestamp } from 'firebase/firestore';

export interface Currency {
  id: string; // 幣別代碼 (TWD, USD, JPY...)
  name: string; // 顯示名稱 (台幣, 美元, 日圓...)
  symbol: string; // 符號 (NT$, $, ¥...)
  code: string; // ISO 幣別代碼
  isSystemDefault: boolean; // 是否為系統預設幣別
  isActive: boolean; // 是否啟用
  order: number; // 排序順序
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// 系統預設幣別常數
export const DEFAULT_CURRENCIES: Omit<Currency, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'TWD',
    code: 'TWD',
    name: '台幣',
    symbol: 'NT$',
    isSystemDefault: true,
    isActive: true,
    order: 0
  },
  {
    id: 'USD',
    code: 'USD',
    name: '美元',
    symbol: '$',
    isSystemDefault: true,
    isActive: true,
    order: 1
  },
  {
    id: 'JPY',
    code: 'JPY',
    name: '日圓',
    symbol: '¥',
    isSystemDefault: true,
    isActive: true,
    order: 2
  },
  {
    id: 'EUR',
    code: 'EUR',
    name: '歐元',
    symbol: '€',
    isSystemDefault: true,
    isActive: true,
    order: 3
  },
  {
    id: 'KRW',
    code: 'KRW',
    name: '韓元',
    symbol: '₩',
    isSystemDefault: true,
    isActive: true,
    order: 4
  },
  {
    id: 'CNY',
    code: 'CNY',
    name: '人民幣',
    symbol: '¥',
    isSystemDefault: true,
    isActive: true,
    order: 5
  },
  {
    id: 'THB',
    code: 'THB',
    name: '泰銖',
    symbol: '฿',
    isSystemDefault: true,
    isActive: true,
    order: 6
  },
  {
    id: 'GBP',
    code: 'GBP',
    name: '英鎊',
    symbol: '£',
    isSystemDefault: true,
    isActive: true,
    order: 7
  }
];
