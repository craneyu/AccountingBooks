import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take, filter, switchMap } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  const currentUser$ = toObservable(authService.currentUser);

  // 1. 先等待 AuthService 初始化完成
  return authService.isInitialized$.pipe(
    filter(initialized => initialized === true),
    take(1),
    switchMap(() => {
      // 2. 初始化完成後，檢查是否為 admin
      return currentUser$.pipe(
        // 過濾掉初始的 undefined，直到獲得真正的 null 或 User 物件
        filter(user => user !== undefined),
        take(1),
        map(user => {
          if (user && user.status === 'active' && user.isAdmin) {
            return true;
          } else if (user && user.status === 'active' && !user.isAdmin) {
            // 非 admin 使用者無法訪問 admin 路由
            return router.createUrlTree(['/trips']);
          } else {
            // 未登入或帳號被停用
            return router.createUrlTree(['/login']);
          }
        })
      );
    })
  );
};
