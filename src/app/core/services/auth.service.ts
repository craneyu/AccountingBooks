import { Injectable, inject, signal, computed, NgZone, Injector, runInInjectionContext } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, user, User as FirebaseUser } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, Timestamp, deleteDoc, writeBatch } from 'firebase/firestore';
import { Router } from '@angular/router';
import { User } from '../models/user.model';
import { of, from, BehaviorSubject } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';

import { toSignal } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);
  private zone = inject(NgZone);
  private injector = inject(Injector);

  // 標記是否已經完成初始狀態檢查
  isInitialized$ = new BehaviorSubject<boolean>(false);
  isInitialized = toSignal(this.isInitialized$, { initialValue: false });

  user$ = runInInjectionContext(this.injector, () => user(this.auth));
  currentUser = signal<User | null>(null);
  isAdmin = computed(() => this.currentUser()?.isAdmin || false);

  constructor() {
    // 監聽驗證狀態
    this.user$.pipe(
      switchMap(u => {
        if (u) {
          return from(this.syncUser(u));
        } else {
          this.isInitialized$.next(true); // 沒登入也算初始化完成
          return of(null);
        }
      }),
      catchError(err => {
        console.error('Auth sync error:', err);
        this.isInitialized$.next(true);
        return of(null);
      })
    ).subscribe(u => {
      this.currentUser.set(u);
      if (u) {
        this.isInitialized$.next(true); // 同步完資料庫才算初始化完成
        
        // 成功登入後若在 login 頁面則導向首頁
        if (this.router.url.includes('/login')) {
          this.zone.run(() => this.router.navigate(['/']));
        }
      }
    });
  }

  async loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      this.auth.languageCode = 'zh-TW';
      
      // 統一使用 Popup，這是目前最穩定的方式
      const result = await signInWithPopup(this.auth, provider);
      if (result.user) {
        // 登入成功後的轉向會由 constructor 中的 subscribe 處理
      }
    } catch (error: any) {
      console.error('Login failed', error);
      // 如果瀏覽器阻擋彈出視窗，這裡可以提示使用者
      if (error.code === 'auth/popup-blocked') {
        alert('請允許瀏覽器的彈出視窗以完成登入。');
      }
      throw error;
    }
  }

  async logout() {
    this.isInitialized$.next(false);
    await signOut(this.auth);
    this.currentUser.set(null);
    this.zone.run(() => this.router.navigate(['/login']));
  }

  /**
   * 申請刪除帳號（7 天後執行）
   */
  async requestDeleteAccount() {
    const currentUser = this.currentUser();
    if (!currentUser) {
      throw new Error('未登入');
    }

    try {
      const userRef = doc(this.firestore, 'users', currentUser.id);
      await updateDoc(userRef, {
        deleteRequestedAt: Timestamp.now(),
        status: 'inactive',
        updatedAt: Timestamp.now()
      });

      // 更新本地狀態
      this.currentUser.set({
        ...currentUser,
        deleteRequestedAt: Timestamp.now(),
        status: 'inactive'
      });

      return true;
    } catch (error) {
      console.error('申請刪除帳號失敗:', error);
      throw error;
    }
  }

  /**
   * 取消刪除帳號申請
   */
  async cancelDeleteRequest() {
    const currentUser = this.currentUser();
    if (!currentUser) {
      throw new Error('未登入');
    }

    try {
      const userRef = doc(this.firestore, 'users', currentUser.id);
      await updateDoc(userRef, {
        deleteRequestedAt: undefined,
        status: 'active',
        updatedAt: Timestamp.now()
      });

      // 更新本地狀態
      this.currentUser.set({
        ...currentUser,
        deleteRequestedAt: undefined,
        status: 'active'
      });

      return true;
    } catch (error) {
      console.error('取消刪除申請失敗:', error);
      throw error;
    }
  }

  private async syncUser(firebaseUser: FirebaseUser): Promise<User | null> {
    try {
      const userRef = doc(this.firestore, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      const now = Timestamp.now();

      // 基本回傳物件，確保頭像來自 Firebase Auth 最準確
      const baseUserData = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        photoURL: firebaseUser.photoURL || undefined,
        displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      };

      if (userSnap.exists()) {
        const dbData = userSnap.data() as User;
        try {
          await updateDoc(userRef, {
            lastLoginAt: now,
            photoURL: firebaseUser.photoURL || dbData.photoURL || undefined,
            displayName: firebaseUser.displayName || dbData.displayName
          });
        } catch (updateErr) {
          console.warn('Update user doc failed (maybe permissions), but continuing:', updateErr);
        }
        
        return {
          ...dbData,
          ...baseUserData, // 覆蓋以確保使用最新的 Auth 資訊
          photoURL: firebaseUser.photoURL || dbData.photoURL || undefined
        };
      } else {
        const usersRef = collection(this.firestore, 'users');
        const q = query(usersRef, where('email', '==', firebaseUser.email));
        const querySnap = await getDocs(q);

        let isAdmin = false;
        let status: 'active' | 'inactive' = 'active';

        if (!querySnap.empty) {
          const preRegDoc = querySnap.docs[0];
          const preRegData = preRegDoc.data() as User;
          isAdmin = preRegData.isAdmin;
          status = preRegData.status;
          if (preRegDoc.id !== firebaseUser.uid) {
            await deleteDoc(preRegDoc.ref);
          }
        }

        const newUser: User = {
          ...baseUserData,
          isAdmin: isAdmin,
          status: status,
          createdAt: now,
          updatedAt: now,
          lastLoginAt: now
        };
        await setDoc(userRef, newUser);

        // 同步成員記錄
        await this.migrateMembersByEmail(firebaseUser.uid, firebaseUser.email || '');
        await this.fixMissingOwnerMembers(firebaseUser.uid, baseUserData.displayName, firebaseUser.email || '');

        return newUser;
      }
    } catch (e) {
      console.error('SyncUser error:', e);
      // 就算同步失敗，至少回傳 Auth 資訊讓 UI 正常
      return {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        photoURL: firebaseUser.photoURL || undefined,
        displayName: firebaseUser.displayName || 'User',
        isAdmin: false,
        status: 'active',
        updatedAt: Timestamp.now()
      } as User;
    }
  }

  /**
   * 遷移按 email 建立的成員記錄到正確的 UID
   * 當使用者首次登入時，檢查是否有使用衍生 ID 的成員記錄，並更新為正確的 UID
   */
  private async migrateMembersByEmail(uid: string, email: string): Promise<void> {
    try {
      // 查找所有 trips 中按 email 衍生 ID 建立的成員
      const derivedId = email.replace('@', '_').replace('.', '_');

      const tripsRef = collection(this.firestore, 'trips');
      const tripsSnap = await getDocs(tripsRef);

      for (const tripDoc of tripsSnap.docs) {
        // 檢查是否存在衍生 ID 的成員
        const derivedMemberRef = doc(this.firestore, `trips/${tripDoc.id}/members`, derivedId);
        const derivedMemberSnap = await getDoc(derivedMemberRef);

        if (derivedMemberSnap.exists()) {
          const memberData = derivedMemberSnap.data();

          // 檢查新 UID 是否已存在
          const newMemberRef = doc(this.firestore, `trips/${tripDoc.id}/members`, uid);
          const newMemberSnap = await getDoc(newMemberRef);

          if (!newMemberSnap.exists()) {
            // 使用 batch 以確保原子性
            const batch = writeBatch(this.firestore);

            // 建立新的正確 UID 成員記錄
            batch.set(newMemberRef, {
              ...memberData,
              userId: uid,
              updatedAt: Timestamp.now()
            });

            // 刪除舊的衍生 ID 成員記錄
            batch.delete(derivedMemberRef);

            await batch.commit();
            console.log(`✓ 遷移成員記錄: ${email} 在 trip ${tripDoc.id} 從 ${derivedId} 到 ${uid}`);
          }
        }
      }
    } catch (e) {
      console.error('遷移成員記錄失敗:', e);
      // 不中斷登入流程
    }
  }

  /**
   * 修復舊行程缺失的 owner 成員記錄
   * 檢查用戶建立的所有行程，如果缺少 owner 成員記錄，自動建立
   * 用於處理在權限系統實施之前建立的舊行程
   */
  private async fixMissingOwnerMembers(uid: string, displayName: string, email: string): Promise<void> {
    try {
      const tripsRef = collection(this.firestore, 'trips');
      const q = query(tripsRef, where('createdBy', '==', uid));
      const tripsSnap = await getDocs(q);

      for (const tripDoc of tripsSnap.docs) {
        const tripId = tripDoc.id;

        // 檢查該行程是否已有該用戶的 member 記錄
        const memberRef = doc(this.firestore, `trips/${tripId}/members`, uid);
        const memberSnap = await getDoc(memberRef);

        if (!memberSnap.exists()) {
          // 缺少 owner 成員記錄，自動建立
          const batch = writeBatch(this.firestore);

          // 新增 owner 成員記錄
          batch.set(memberRef, {
            userId: uid,
            role: 'owner',
            displayName: displayName,
            email: email,
            joinedAt: Timestamp.now(),
            addedBy: uid,
            updatedAt: Timestamp.now()
          });

          // 更新 trip 的 ownerId 和 memberCount（如果缺少）
          const tripData = tripDoc.data() as any;
          if (!tripData['ownerId'] || !tripData['memberCount']) {
            batch.update(tripDoc.ref, {
              ownerId: uid,
              memberCount: 1,
              updatedAt: Timestamp.now()
            });
          }

          await batch.commit();
          console.log(`✓ 修復舊行程: ${tripId} 新增 owner 成員記錄`);
        }
      }
    } catch (e) {
      console.error('修復舊行程失敗:', e);
      // 不中斷登入流程
    }
  }
}
