import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { TripsComponent } from './pages/trips/trips';
import { ExpensesComponent } from './pages/expenses/expenses';
import { AdminDashboardComponent } from './pages/admin/dashboard/dashboard';
import { TripManagementComponent } from './pages/admin/trip-management/trip-management';
import { UserManagementComponent } from './pages/admin/user-management/user-management';
import { StatisticsComponent } from './pages/admin/statistics/statistics';
import { CategoryManagementComponent } from './pages/admin/category-management/category-management';
import { PaymentMethodManagementComponent } from './pages/admin/payment-method-management/payment-method-management';
import { CurrenciesComponent } from './pages/admin/currencies/currencies.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'trips',
        pathMatch: 'full'
      },
      {
        path: 'trips',
        component: TripsComponent
      },
      {
        path: 'trip/:tripId/expenses',
        component: ExpensesComponent
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        children: [
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          { path: 'dashboard', component: AdminDashboardComponent },
          { path: 'trips', component: TripManagementComponent },
          { path: 'users', component: UserManagementComponent },
          { path: 'stats', component: StatisticsComponent },
          { path: 'categories', component: CategoryManagementComponent },
          { path: 'payment-methods', component: PaymentMethodManagementComponent },
          { path: 'currencies', component: CurrenciesComponent }
        ]
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];