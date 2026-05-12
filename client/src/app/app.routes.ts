import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';

export const routes: Routes = [
  {
    path: 'auth',
    loadComponent: () => import('./pages/auth/auth.component').then(m => m.AuthComponent),
    canActivate: [guestGuard]
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./pages/reset-password/reset-password.component').then(m => m.ResetPasswordComponent)
  },
  {
    path: 'onboarding',
    loadComponent: () => import('./pages/onboarding/onboarding.component').then(m => m.OnboardingComponent),
    canActivate: [authGuard]
  },
  {
    path: '',
    loadComponent: () => import('./pages/shell/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'expenses', loadComponent: () => import('./pages/expenses/expenses.component').then(m => m.ExpensesComponent) },
      { path: 'habits', loadComponent: () => import('./pages/habits/habits.component').then(m => m.HabitsComponent) },
      { path: 'archive', loadComponent: () => import('./pages/archive/archive.component').then(m => m.ArchiveComponent) },
    ]
  },
  { path: '**', redirectTo: '' }
];
