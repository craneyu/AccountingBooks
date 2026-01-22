import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, addDoc, updateDoc, deleteDoc, query, orderBy, writeBatch } from '@angular/fire/firestore';
import { Category } from '../models/category.model';
import { Observable, of } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { Timestamp } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private firestore = inject(Firestore);
  private categoriesRef = collection(this.firestore, 'categories');

  private categories$ = collectionData(
    query(this.categoriesRef, orderBy('order', 'asc')),
    { idField: 'id' }
  ).pipe(
    map(actions => actions as Category[]),
    shareReplay(1)
  );

  getCategories(): Observable<Category[]> {
    return this.categories$;
  }

  async addCategory(category: Omit<Category, 'id'>) {
    return addDoc(this.categoriesRef, {
      ...category,
      createdAt: Timestamp.now()
    });
  }

  async updateCategory(id: string, data: Partial<Category>) {
    const docRef = doc(this.firestore, 'categories', id);
    return updateDoc(docRef, data);
  }

  async deleteCategory(id: string) {
    const docRef = doc(this.firestore, 'categories', id);
    return deleteDoc(docRef);
  }

  async updateOrders(categories: Category[]) {
    const batch = writeBatch(this.firestore);
    categories.forEach((cat, index) => {
      const docRef = doc(this.firestore, 'categories', cat.id!);
      batch.update(docRef, { order: index });
    });
    return batch.commit();
  }
}