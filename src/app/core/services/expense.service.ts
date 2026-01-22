import { Injectable, inject } from '@angular/core';
import { Firestore, collectionData } from '@angular/fire/firestore';
import { collection, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { Expense } from '../models/expense.model';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private firestore = inject(Firestore);

  getExpenses(tripId: string): Observable<Expense[]> {
    const expensesRef = collection(this.firestore, `trips/${tripId}/expenses`);
    const q = query(expensesRef, orderBy('expenseDate', 'desc'));
    return collectionData(q, { idField: 'id' }) as Observable<Expense[]>;
  }

  async addExpense(tripId: string, expense: Omit<Expense, 'id'>) {
    const expensesRef = collection(this.firestore, `trips/${tripId}/expenses`);
    return addDoc(expensesRef, expense);
  }

  async updateExpense(tripId: string, expenseId: string, data: Partial<Expense>) {
    const docRef = doc(this.firestore, `trips/${tripId}/expenses/${expenseId}`);
    return updateDoc(docRef, data as any);
  }

  async deleteExpense(tripId: string, expenseId: string) {
    const docRef = doc(this.firestore, `trips/${tripId}/expenses/${expenseId}`);
    return deleteDoc(docRef);
  }
}