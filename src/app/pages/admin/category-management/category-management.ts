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
import Swal from 'sweetalert2';

@Component({
  selector: 'app-category-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FontAwesomeModule, DragDropModule],
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

  async drop(event: CdkDragDrop<Category[]>) {
    this.categories$.pipe(take(1)).subscribe(async (currentCategories) => {
      const newArray = [...currentCategories];
      moveItemInArray(newArray, event.previousIndex, event.currentIndex);
      
      try {
        await this.categoryService.updateOrders(newArray);
        // Toast notification optional, UI will update automatically via observable
      } catch (error) {
        Swal.fire('錯誤', '排序更新失敗', 'error');
      }
    });
  }

  async addCategory() {
    const { value: name } = await Swal.fire({
      title: '新增類別',
      input: 'text',
      inputLabel: '類別名稱',
      inputPlaceholder: '例如：醫療、保險...',
      showCancelButton: true,
      confirmButtonText: '新增',
      cancelButtonText: '取消'
    });

    if (name) {
      try {
        this.categories$.pipe(take(1)).subscribe(async (list) => {
            await this.categoryService.addCategory({
                name,
                order: list.length
            });
            Swal.fire({ icon: 'success', title: '已新增', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
        });
      } catch (error) {
        Swal.fire('錯誤', '新增失敗', 'error');
      }
    }
  }

  async editCategory(category: Category) {
    const { value: name } = await Swal.fire({
      title: '編輯類別',
      input: 'text',
      inputLabel: '類別名稱',
      inputValue: category.name,
      showCancelButton: true,
      confirmButtonText: '儲存',
      cancelButtonText: '取消'
    });

    if (name && name !== category.name) {
      try {
        await this.categoryService.updateCategory(category.id!, { name });
        Swal.fire({ icon: 'success', title: '已更新', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
      } catch (error) {
        Swal.fire('錯誤', '更新失敗', 'error');
      }
    }
  }

  async deleteCategory(category: Category) {
    const result = await Swal.fire({
      title: '確定要刪除此類別嗎？',
      text: `類別：${category.name}。刪除後不會影響舊有支出，但之後新增支出將無法選擇。`,
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