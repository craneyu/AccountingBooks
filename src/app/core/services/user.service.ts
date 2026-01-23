import { Injectable, inject, Injector } from '@angular/core';
import { Firestore, collection, collectionData, doc, updateDoc, query, orderBy, addDoc, setDoc, deleteDoc } from '@angular/fire/firestore';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { User } from '../models/user.model';
import { Observable } from 'rxjs';
import { Timestamp } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private firestore = inject(Firestore);
  private injector = inject(Injector);

  getUsers(): Observable<User[]> {
    const usersRef = collection(this.firestore, 'users');
    const q = query(usersRef, orderBy('createdAt', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<User[]>;
  }

  async addUser(userData: Partial<User>) {
    const usersRef = collection(this.firestore, 'users');
    const now = Timestamp.now();
    const finalData = {
      ...userData,
      status: userData.status || 'active',
      isAdmin: userData.isAdmin || false,
      createdAt: now,
      updatedAt: now,
      lastLoginAt: now
    };
    return addDoc(usersRef, finalData);
  }

  async deleteUser(userId: string) {
    const userRef = doc(this.firestore, 'users', userId);
    return deleteDoc(userRef);
  }

  async updateUser(userId: string, data: Partial<User>) {
    const userRef = doc(this.firestore, 'users', userId);
    return updateDoc(userRef, {
      ...data,
      updatedAt: Timestamp.now()
    });
  }

  async toggleAdmin(userId: string, currentStatus: boolean) {
    return this.updateUser(userId, { isAdmin: !currentStatus });
  }

  async toggleStatus(userId: string, currentStatus: 'active' | 'inactive') {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    return this.updateUser(userId, { status: newStatus });
  }

  /**
   * 申請刪除帳號（7 天後執行）
   */
  async requestDelete(userId: string) {
    return this.updateUser(userId, {
      deleteRequestedAt: Timestamp.now(),
      status: 'inactive'
    });
  }

  /**
   * 取消刪除帳號申請
   */
  async cancelDeleteRequest(userId: string) {
    return this.updateUser(userId, {
      deleteRequestedAt: undefined,
      status: 'active'
    });
  }

  /**
   * 檢查帳號是否已超過 7 天刪除窗口
   */
  isDeletionExpired(deleteRequestedAt?: Timestamp): boolean {
    if (!deleteRequestedAt) return false;
    const now = new Date();
    const requested = deleteRequestedAt.toDate();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    return now.getTime() - requested.getTime() > sevenDaysMs;
  }

  /**
   * 計算剩餘刪除天數
   */
  getRemainingDays(deleteRequestedAt?: Timestamp): number {
    if (!deleteRequestedAt) return 0;
    const now = new Date();
    const requested = deleteRequestedAt.toDate();
    const remainingMs = 7 * 24 * 60 * 60 * 1000 - (now.getTime() - requested.getTime());
    return Math.ceil(remainingMs / (24 * 60 * 60 * 1000));
  }

  /**
   * 同步所有使用者的 photoURL（管理員功能）
   */
  async syncAllUsersPhotoURL(): Promise<any> {
    try {
      const functions = this.injector.get(Functions, null);
      if (!functions) {
        throw new Error('Firebase Functions 不可用');
      }
      const syncFn = httpsCallable(functions, 'syncAllUsersPhotoURL');
      return syncFn({});
    } catch (error) {
      console.error('[UserService] 同步用户头像失败:', error);
      throw error;
    }
  }
}