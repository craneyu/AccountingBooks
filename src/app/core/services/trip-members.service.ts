import { Injectable, inject } from '@angular/core';
import { Firestore, collectionData, docData } from '@angular/fire/firestore';
import {
  collection,
  query,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  Timestamp,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { TripMember } from '../models/trip-member.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TripMembersService {
  private firestore = inject(Firestore);

  getTripMembers(tripId: string): Observable<TripMember[]> {
    const membersRef = collection(this.firestore, `trips/${tripId}/members`);
    const q = query(membersRef);
    return collectionData(q, { idField: 'id' }) as Observable<TripMember[]>;
  }

  getTripMember(tripId: string, userId: string): Observable<TripMember | undefined> {
    const docRef = doc(this.firestore, `trips/${tripId}/members`, userId);
    return docData(docRef, { idField: 'id' }) as Observable<TripMember>;
  }

  async addMember(tripId: string, member: Omit<TripMember, 'id'>) {
    const membersRef = collection(this.firestore, `trips/${tripId}/members`);
    return addDoc(membersRef, {
      ...member,
      updatedAt: Timestamp.now()
    });
  }

  async addMemberWithUserId(tripId: string, userId: string, member: Omit<TripMember, 'id' | 'userId'>) {
    const docRef = doc(this.firestore, `trips/${tripId}/members`, userId);
    return setDoc(docRef, {
      userId,
      ...member,
      updatedAt: Timestamp.now()
    });
  }

  async updateMember(tripId: string, userId: string, data: Partial<TripMember>) {
    const docRef = doc(this.firestore, `trips/${tripId}/members`, userId);
    return updateDoc(docRef, {
      ...data,
      updatedAt: Timestamp.now()
    } as any);
  }

  async removeMember(tripId: string, userId: string) {
    const docRef = doc(this.firestore, `trips/${tripId}/members`, userId);
    return deleteDoc(docRef);
  }

  async checkMembership(tripId: string, userId: string): Promise<boolean> {
    const docRef = doc(this.firestore, `trips/${tripId}/members`, userId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  }

  async getMemberRole(tripId: string, userId: string): Promise<string | null> {
    const docRef = doc(this.firestore, `trips/${tripId}/members`, userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as TripMember;
      return data.role;
    }
    return null;
  }

  // 批量建立成員（用於資料遷移）
  async createMembersInBatch(tripId: string, members: TripMember[]): Promise<void> {
    const batch = writeBatch(this.firestore);

    members.forEach(member => {
      const docRef = doc(this.firestore, `trips/${tripId}/members`, member.userId);
      batch.set(docRef, {
        ...member,
        updatedAt: Timestamp.now()
      });
    });

    await batch.commit();
  }
}
