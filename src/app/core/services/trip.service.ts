import { Injectable, inject } from '@angular/core';
import { Firestore, collectionData, docData } from '@angular/fire/firestore';
import { collection, query, where, orderBy, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Trip } from '../models/trip.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TripService {
  private firestore = inject(Firestore);

  getActiveTrips(): Observable<Trip[]> {
    const tripsRef = collection(this.firestore, 'trips');
    const q = query(
      tripsRef, 
      where('status', '==', 'active'),
      orderBy('startDate', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Trip[]>;
  }

  getAllTrips(): Observable<Trip[]> {
    const tripsRef = collection(this.firestore, 'trips');
    const q = query(
      tripsRef, 
      orderBy('startDate', 'desc')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Trip[]>;
  }

  getTrip(id: string): Observable<Trip | undefined> {
    const docRef = doc(this.firestore, 'trips', id);
    return docData(docRef, { idField: 'id' }) as Observable<Trip>;
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