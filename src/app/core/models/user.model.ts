import { Timestamp } from 'firebase/firestore';

export interface User {
  id: string; // Firebase UID
  email: string;
  displayName: string;
  photoURL?: string;
  isAdmin: boolean;
  status: 'active' | 'inactive';
  createdAt: Timestamp;
  createdBy?: string;
  lastLoginAt: Timestamp;
  updatedAt: Timestamp;
  deleteRequestedAt?: Timestamp; // 新增：帳號註銷申請時間
  deletedAt?: Timestamp; // 新增：帳號實際刪除時間
}
