import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PaymentMethodService } from '../../../core/services/payment-method.service';
import { PaymentMethod } from '../../../core/models/payment-method.model';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faPlus, faEdit, faTrash, faWallet, faGripVertical } from '@fortawesome/free-solid-svg-icons';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import Swal from 'sweetalert2';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-payment-method-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FontAwesomeModule, DragDropModule],
  templateUrl: './payment-method-management.html',
  styleUrl: './payment-method-management.scss'
})
export class PaymentMethodManagementComponent {
  private paymentMethodService = inject(PaymentMethodService);

  // Use signals for better reactivity
  private methodsFromDB = toSignal(this.paymentMethodService.getPaymentMethods(), { initialValue: [] });
  methods = signal<PaymentMethod[]>([]);

  faArrowLeft = faArrowLeft;
  faPlus = faPlus;
  faEdit = faEdit;
  faTrash = faTrash;
  faWallet = faWallet;
  faGripVertical = faGripVertical;

  constructor() {
    // Sync DB data to local signal
    effect(() => {
      const dbMethods = this.methodsFromDB();
      this.methods.set([...dbMethods]);
    });
  }

  async drop(event: CdkDragDrop<PaymentMethod[]>) {
    const currentMethods = this.methods();
    const newArray = [...currentMethods];
    moveItemInArray(newArray, event.previousIndex, event.currentIndex);

    // Update local state immediately for smooth UX
    this.methods.set(newArray);

    try {
      await this.paymentMethodService.updateOrders(newArray);
      Swal.fire({
        icon: 'success',
        title: '排序已更新',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 1500
      });
    } catch (error) {
      // Revert on error
      this.methods.set(currentMethods);
      Swal.fire('錯誤', '排序更新失敗', 'error');
    }
  }

  async addMethod() {
    const { value: name } = await Swal.fire({
      title: '新增支付方式',
      input: 'text',
      inputLabel: '支付方式名稱',
      inputPlaceholder: '例如：悠遊卡、LINE Pay...',
      showCancelButton: true,
      confirmButtonText: '新增',
      cancelButtonText: '取消'
    });

    if (name) {
      try {
        const list = this.methods();
        await this.paymentMethodService.addPaymentMethod({
          name,
          order: list.length
        });
        Swal.fire({ icon: 'success', title: '已新增', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
      } catch (error) {
        Swal.fire('錯誤', '新增失敗', 'error');
      }
    }
  }

  async editMethod(method: PaymentMethod) {
    const { value: name } = await Swal.fire({
      title: '編輯支付方式',
      input: 'text',
      inputLabel: '名稱',
      inputValue: method.name,
      showCancelButton: true,
      confirmButtonText: '儲存',
      cancelButtonText: '取消'
    });

    if (name && name !== method.name) {
      try {
        await this.paymentMethodService.updatePaymentMethod(method.id!, { name });
        Swal.fire({ icon: 'success', title: '已更新', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
      } catch (error) {
        Swal.fire('錯誤', '更新失敗', 'error');
      }
    }
  }

  async deleteMethod(method: PaymentMethod) {
    const result = await Swal.fire({
      title: '確定要刪除此支付方式嗎？',
      text: `支付方式：${method.name}。`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e53e3e',
      confirmButtonText: '是的，刪除',
      cancelButtonText: '取消'
    });

    if (result.isConfirmed) {
      try {
        await this.paymentMethodService.deletePaymentMethod(method.id!);
        Swal.fire({ icon: 'success', title: '已刪除', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000 });
      } catch (error) {
        Swal.fire('錯誤', '刪除失敗', 'error');
      }
    }
  }
}