import { Injectable, inject, signal, computed, NgZone } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithRedirect, signInWithPopup, signOut, user, getRedirectResult, User as FirebaseUser } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, Timestamp, deleteDoc } from 'firebase/firestore';
import { Router } from '@angular/router';
import { User } from '../models/user.model';
import { of, from } from 'rxjs';
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

  // Firebase Auth User Signal
  user$ = user(this.auth);
  firebaseUser = toSignal(this.user$);

  // App User Data Signal
  currentUser = signal<User | null>(null);

  isAdmin = computed(() => this.currentUser()?.isAdmin || false);

  constructor() {
    // 1. 監聽 Auth 狀態並同步使用者資料
    this.user$.pipe(
      switchMap(u => {
        if (u) {
          return from(this.syncUser(u));
        } else {
          return of(null);
        }
      }),
      catchError(err => {
        console.error('Auth sync error:', err);
        return of(null);
      })
    ).subscribe(u => {
      this.currentUser.set(u);
      
      // 如果已登入且在登入頁面，自動導向首頁
      if (u && this.router.url.includes('/login')) {
        this.zone.run(() => {
          this.router.navigate(['/']);
        });
      }
    });

    // 2. 處理 Redirect 登入後的結果
    this.handleRedirectResult();
  }

  private async handleRedirectResult() {
    try {
      const result = await getRedirectResult(this.auth);
      if (result?.user) {
        this.zone.run(() => {
          this.router.navigate(['/']);
        });
      }
    } catch (error) {
      console.error('Redirect login error:', error);
    }
  }

  async loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      this.auth.languageCode = 'zh-TW';
      
      const isLocalhost = window.location.hostname === 'localhost';
      
      if (isLocalhost) {
        const result = await signInWithPopup(this.auth, provider);
        if (result.user) {
          this.zone.run(() => {
            this.router.navigate(['/']);
          });
        }
      } else {
        await signInWithRedirect(this.auth, provider);
      }
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  }

  async logout() {
    await signOut(this.auth);
    this.currentUser.set(null);
    this.zone.run(() => {
      this.router.navigate(['/login']);
    });
  }

  private async syncUser(firebaseUser: FirebaseUser): Promise<User> {
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
        displayName: firebaseUser.displayName || 'User',
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
  }
}
