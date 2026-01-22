import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { MainLayoutComponent } from './layout/main-layout/main-layout';
import { authGuard } from './core/guards/auth.guard';
import { TripsComponent } from './pages/trips/trips';
import { ExpensesComponent } from './pages/expenses/expenses';
import { AdminDashboardComponent } from './pages/admin/dashboard/dashboard';
import { TripManagementComponent } from './pages/admin/trip-management/trip-management';
import { UserManagementComponent } from './pages/admin/user-management/user-management';
import { StatisticsComponent } from './pages/admin/statistics/statistics';

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
        children: [
          { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
          { path: 'dashboard', component: AdminDashboardComponent },
          { path: 'trips', component: TripManagementComponent },
          { path: 'users', component: UserManagementComponent },
          { path: 'stats', component: StatisticsComponent }
        ]
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];