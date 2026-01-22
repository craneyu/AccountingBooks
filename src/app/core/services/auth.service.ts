import { Injectable, inject, signal, computed } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, user, User as FirebaseUser } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { Router } from '@angular/router';
import { User } from '../models/user.model';
import { of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  // Firebase Auth User Signal
  user$ = user(this.auth);
  firebaseUser = toSignal(this.user$);

  // App User Data Signal
  currentUser = signal<User | null>(null);

  isAdmin = computed(() => this.currentUser()?.isAdmin || false);

  constructor() {
    // Monitor auth state and fetch user data from Firestore
    this.user$.pipe(
      switchMap(u => {
        if (u) {
          return this.syncUser(u);
        } else {
          return of(null);
        }
      })
    ).subscribe(u => {
      this.currentUser.set(u);
    });
  }

  async loginWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(this.auth, provider);
      if (credential.user) {
        this.router.navigate(['/']);
      }
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  }

  async logout() {
    await signOut(this.auth);
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }

  private async syncUser(firebaseUser: FirebaseUser): Promise<User> {
    const userRef = doc(this.firestore, 'users', firebaseUser.uid);
    const userSnap = await getDoc(userRef);
    const now = Timestamp.now();

    if (userSnap.exists()) {
      const userData = userSnap.data() as User;
      // Temporary: Force admin for dev
      if (!userData.isAdmin) {
         await updateDoc(userRef, { isAdmin: true, lastLoginAt: now });
         userData.isAdmin = true;
      } else {
         await updateDoc(userRef, { lastLoginAt: now });
      }
      return userData;
    } else {
      const newUser: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'User',
        photoURL: firebaseUser.photoURL || undefined,
        isAdmin: true, // Temporary: Force admin for dev
        status: 'active',
        createdAt: now,
        updatedAt: now,
        lastLoginAt: now
      };
      await setDoc(userRef, newUser);
      return newUser;
    }
  }
}

