import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take, filter } from 'rxjs/operators';
import { toObservable } from '@angular/core/rxjs-interop';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  // Convert the currentUser signal to an observable and wait for it to be loaded
  return toObservable(authService.currentUser).pipe(
    // We need to wait until the auth state is determined (not undefined/null initially if it's still loading)
    // However, if the user is truly null (not logged in), we should redirect.
    // AuthService sets currentUser to null if not logged in.
    filter(user => user !== undefined), 
    take(1),
    map(user => {
      if (user && user.status === 'active') {
        return true;
      } else if (user && user.status === 'inactive') {
        // You might want to show a specific "Account Disabled" message
        alert('您的帳號已被停用，請聯絡管理員。');
        authService.logout();
        return false;
      } else {
        return router.createUrlTree(['/login']);
      }
    })
  );
};