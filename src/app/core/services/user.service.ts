import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, updateDoc, query, orderBy, addDoc, setDoc } from '@angular/fire/firestore';
import { User } from '../models/user.model';
import { Observable } from 'rxjs';
import { Timestamp } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private firestore = inject(Firestore);

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

  async updateUser(userId: string, data: Partial<User>) {
    const userRef = doc(this.firestore, 'users', userId);
    return updateDoc(userRef, {
      ...data,
      updatedAt: new Date() // Firestore modular SDK will handle Date to Timestamp if configured, or use Timestamp.now()
    });
  }

  async toggleAdmin(userId: string, currentStatus: boolean) {
    return this.updateUser(userId, { isAdmin: !currentStatus });
  }

  async toggleStatus(userId: string, currentStatus: 'active' | 'inactive') {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    return this.updateUser(userId, { status: newStatus });
  }
}
