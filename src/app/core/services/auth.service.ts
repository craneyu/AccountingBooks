import { Injectable, inject, signal, computed, NgZone } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, user, User as FirebaseUser } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, Timestamp, deleteDoc } from 'firebase/firestore';
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

  // 標記是否已經完成初始狀態檢查
  isInitialized$ = new BehaviorSubject<boolean>(false);
  isInitialized = toSignal(this.isInitialized$, { initialValue: false });

  user$ = user(this.auth);
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

      if (userSnap.exists()) {
        const userData = userSnap.data() as User;
        await updateDoc(userRef, { lastLoginAt: now });
        return { ...userData, id: firebaseUser.uid };
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
          id: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          photoURL: firebaseUser.photoURL || undefined,
          isAdmin: isAdmin,
          status: status,
          createdAt: now,
          updatedAt: now,
          lastLoginAt: now
        };
        await setDoc(userRef, newUser);
        return newUser;
      }
    } catch (e) {
      console.error('SyncUser error:', e);
      return null;
    }
  }
}
