import { Timestamp } from 'firebase/firestore';

export interface Trip {
  id?: string;
  name: string;
  startDate: Timestamp;
  endDate: Timestamp;
  status: 'active' | 'inactive';
  createdAt?: Timestamp;
  createdBy: string;
  ownerId?: string; // 新增：旅程所有者（用於成員管理）
  updatedAt: Timestamp;
  currency: string;
  coverImage?: string;
  description?: string;
  memberCount?: number; // 新增：成員數量（反正規化，優化查詢）
  customCurrencies?: string[]; // 新增：自訂幣別代碼陣列
}
