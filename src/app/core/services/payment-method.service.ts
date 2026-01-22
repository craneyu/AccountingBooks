import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, addDoc, updateDoc, deleteDoc, query, orderBy, writeBatch } from '@angular/fire/firestore';
import { PaymentMethod } from '../models/payment-method.model';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { Timestamp } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class PaymentMethodService {
  private firestore = inject(Firestore);
  private methodsRef = collection(this.firestore, 'paymentMethods');

  private methods$ = collectionData(
    query(this.methodsRef, orderBy('order', 'asc')),
    { idField: 'id' }
  ).pipe(
    map(actions => actions as PaymentMethod[]),
    shareReplay(1)
  );

  getPaymentMethods(): Observable<PaymentMethod[]> {
    return this.methods$;
  }

  async addPaymentMethod(method: Omit<PaymentMethod, 'id'>) {
    return addDoc(this.methodsRef, {
      ...method,
      createdAt: Timestamp.now()
    });
  }

  async updatePaymentMethod(id: string, data: Partial<PaymentMethod>) {
    const docRef = doc(this.firestore, 'paymentMethods', id);
    return updateDoc(docRef, data);
  }

  async deletePaymentMethod(id: string) {
    const docRef = doc(this.firestore, 'paymentMethods', id);
    return deleteDoc(docRef);
  }

  async updateOrders(methods: PaymentMethod[]) {
    const batch = writeBatch(this.firestore);
    methods.forEach((m, index) => {
      const docRef = doc(this.firestore, 'paymentMethods', m.id!);
      batch.update(docRef, { order: index });
    });
    return batch.commit();
  }
}
