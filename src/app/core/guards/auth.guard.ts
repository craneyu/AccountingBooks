import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take, filter, switchMap } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  
  // 核心修正：將 toObservable 移至頂層宣告，確保處於 Injection Context 中
  const currentUser$ = toObservable(authService.currentUser);

  // 1. 先等待 AuthService 初始化完成
  return authService.isInitialized$.pipe(
    filter(initialized => initialized === true),
    take(1),
    switchMap(() => {
      // 2. 初始化完成後，再檢查目前使用者狀態
      return currentUser$.pipe(
        // 過濾掉初始的 undefined，直到獲得真正的 null 或 User 物件
        filter(user => user !== undefined),
        take(1),
        map(user => {
          if (user && user.status === 'active') {
            return true;
          } else if (user && user.status === 'inactive') {
            alert('您的帳號已被停用，請聯絡管理員。');
            authService.logout();
            return false;
          } else {
            return router.createUrlTree(['/login']);
          }
        })
      );
    })
  );
};