import { Injectable, inject, Injector, runInInjectionContext } from '@angular/core';
import { Firestore, collectionData, docData, collectionGroup } from '@angular/fire/firestore';
import { collection, query, where, orderBy, doc, addDoc, updateDoc, deleteDoc, getDocs, getDoc } from 'firebase/firestore';
import { Trip } from '../models/trip.model';
import { Observable, from, of, forkJoin } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TripService {
  private firestore = inject(Firestore);
  private injector = inject(Injector);

  getAllTrips(): Observable<Trip[]> {
    const tripsRef = collection(this.firestore, 'trips');
    const q = query(
      tripsRef, 
      orderBy('startDate', 'desc')
    );
    return runInInjectionContext(this.injector, () => collectionData(q, { idField: 'id' }) as Observable<Trip[]>);
  }

  getTrip(id: string): Observable<Trip | undefined> {
    const docRef = doc(this.firestore, 'trips', id);
    return runInInjectionContext(this.injector, () => docData(docRef, { idField: 'id' }) as Observable<Trip>);
  }

  /**
   * 取得使用者的旅程
   * 使用 Collection Group Query 避免權限問題
   */
  getTripsForUser(userId: string): Observable<Trip[]> {
    const membersQuery = query(
      collectionGroup(this.firestore, 'members'),
      where('userId', '==', userId)
    );

    return from(getDocs(membersQuery)).pipe(
      switchMap(snapshot => {
        const tripIds = snapshot.docs
          .map(d => d.ref.parent.parent?.id)
          .filter((id): id is string => !!id);
        
        const uniqueTripIds = [...new Set(tripIds)];
        
        if (uniqueTripIds.length === 0) {
          return of([]);
        }

        // 讀取所有相關旅程
        const tasks = uniqueTripIds.map(async id => {
          try {
            const docRef = doc(this.firestore, 'trips', id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              return { id: docSnap.id, ...docSnap.data() } as Trip;
            }
            return null;
          } catch (e) {
            console.error(`Error fetching trip ${id}:`, e);
            return null;
          }
        });

        return from(Promise.all(tasks)).pipe(
          map(trips => trips
            .filter((t): t is Trip => !!t) // 過濾掉讀取失敗或不存在的旅程
            .sort((a, b) => {
              // 處理 Timestamp
              const tA = a.startDate && (a.startDate as any).seconds ? (a.startDate as any).seconds : 0;
              const tB = b.startDate && (b.startDate as any).seconds ? (b.startDate as any).seconds : 0;
              return tB - tA;
            })
          )
        );
      })
    );
  }

  async addTrip(trip: Omit<Trip, 'id'>) {
    const tripsRef = collection(this.firestore, 'trips');
    return addDoc(tripsRef, trip);
  }

  async updateTrip(id: string, data: Partial<Trip>) {
    const docRef = doc(this.firestore, 'trips', id);
    return updateDoc(docRef, data as any);
  }

  async deleteTrip(id: string) {
    const docRef = doc(this.firestore, 'trips', id);
    return deleteDoc(docRef);
  }
}