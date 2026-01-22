import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../../core/services/category.service';
import { Category } from '../../../core/models/category.model';
import { Observable, take } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faPlus, faEdit, faTrash, faGripLines } from '@fortawesome/free-solid-svg-icons';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { CategoryDialogComponent } from '../../../components/category-dialog/category-dialog';
import { getIcon } from '../../../core/utils/icon-utils';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FontAwesomeModule, DragDropModule, CategoryDialogComponent],
  templateUrl: './category-management.html',
  styleUrl: './category-management.scss'
})
export class CategoryManagementComponent {
  private categoryService = inject(CategoryService);

  categories$: Observable<Category[]> = this.categoryService.getCategories();
  
  faArrowLeft = faArrowLeft;
  faPlus = faPlus;
  faEdit = faEdit;
  faTrash = faTrash;
  faGripLines = faGripLines;

  // Dialog state
  showDialog = false;
  selectedCategory: Category | null = null;
  currentCount = 0;

  constructor() {
    this.categories$.subscribe(list => this.currentCount = list.length);
  }

  getCategoryIcon(iconName: string | undefined) {
    return getIcon(iconName);
  }

  async drop(event: CdkDragDrop<Category[]>) {
    this.categories$.pipe(take(1)).subscribe(async (currentCategories) => {
      const newArray = [...currentCategories];
      moveItemInArray(newArray, event.previousIndex, event.currentIndex);
      
      try {
        await this.categoryService.updateOrders(newArray);
      } catch (error) {
        Swal.fire('錯誤', '排序更新失敗', 'error');
      }
    });
  }

  openAdd() {
    this.selectedCategory = null;
    this.showDialog = true;
  }

  openEdit(category: Category) {
    this.selectedCategory = category;
    this.showDialog = true;
  }

  closeDialog() {
    this.showDialog = false;
    this.selectedCategory = null;
  }

  async deleteCategory(category: Category) {
    const result = await Swal.fire({
      title: '確定要刪除此類別嗎？',
      text: `類別：${category.name}。`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e53e3e',
      confirmButtonText: '是的，刪除',
      cancelButtonText: '取消'
    });

    if (result.isConfirmed) {
      try {
        await this.categoryService.deleteCategory(category.id!);
        Swal.fire({ icon: 'success', title: '已刪除', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
      } catch (error) {
        Swal.fire('錯誤', '刪除失敗', 'error');
      }
    }
  }
}
