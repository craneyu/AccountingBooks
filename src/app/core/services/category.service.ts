import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, doc, addDoc, updateDoc, deleteDoc, query, orderBy } from '@angular/fire/firestore';
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

  // Cache categories for better performance and consistency
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

  // Helper to initialize default categories if empty
  async initializeDefaults() {
    const defaults = ['餐飲', '交通', '住宿', '購物', '娛樂', '其他'];
    // We would check if empty first, but for now we provide this as a utility
  }
}
