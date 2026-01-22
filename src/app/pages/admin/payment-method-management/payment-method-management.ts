import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PaymentMethodService } from '../../../core/services/payment-method.service';
import { PaymentMethod } from '../../../core/models/payment-method.model';
import { Observable } from 'rxjs';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faArrowLeft, faPlus, faEdit, faTrash, faWallet, faGripLines } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-payment-method-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, FontAwesomeModule],
  templateUrl: './payment-method-management.html',
  styleUrl: './payment-method-management.scss'
})
export class PaymentMethodManagementComponent {
  private paymentMethodService = inject(PaymentMethodService);

  methods$: Observable<PaymentMethod[]> = this.paymentMethodService.getPaymentMethods();
  
  faArrowLeft = faArrowLeft;
  faPlus = faPlus;
  faEdit = faEdit;
  faTrash = faTrash;
  faWallet = faWallet;
  faGripLines = faGripLines;

  async addMethod() {
    const { value: name } = await Swal.fire({
      title: '新增支付方式',
      input: 'text',
      inputLabel: '支付方式名稱',
      inputPlaceholder: '例如：悠遊卡、LINE Pay...',
      showCancelButton: true,
      confirmButtonText: '新增',
      cancelButtonText: '取消',
      background: '#e0e5ec',
      color: '#2d3748'
    });

    if (name) {
      try {
        await this.paymentMethodService.addPaymentMethod({
          name,
          order: 99
        });
        Swal.fire({ icon: 'success', title: '已新增', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, background: '#e0e5ec', color: '#2d3748' });
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
      cancelButtonText: '取消',
      background: '#e0e5ec',
      color: '#2d3748'
    });

    if (name && name !== method.name) {
      try {
        await this.paymentMethodService.updatePaymentMethod(method.id!, { name });
        Swal.fire({ icon: 'success', title: '已更新', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, background: '#e0e5ec', color: '#2d3748' });
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
      cancelButtonText: '取消',
      background: '#e0e5ec',
      color: '#2d3748'
    });

    if (result.isConfirmed) {
      try {
        await this.paymentMethodService.deletePaymentMethod(method.id!);
        Swal.fire({ icon: 'success', title: '已刪除', toast: true, position: 'top-end', showConfirmButton: false, timer: 2000, background: '#e0e5ec', color: '#2d3748' });
      } catch (error) {
        Swal.fire('錯誤', '刪除失敗', 'error');
      }
    }
  }
}
