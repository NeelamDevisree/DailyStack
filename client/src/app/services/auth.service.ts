import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';

interface AuthUser {
  id: string;
  email: string;
}

interface AuthResponse {
  user: AuthUser;
  token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private user$ = new BehaviorSubject<AuthUser | null>(null);
  user = this.user$.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    const stored = localStorage.getItem('ds_user');
    if (stored) {
      try { this.user$.next(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    return localStorage.getItem('ds_token');
  }

  getUserId(): string | null {
    return this.user$.value?.id ?? null;
  }

  async signIn(email: string, password: string): Promise<void> {
    const res = await firstValueFrom(this.http.post<AuthResponse>('/api/auth/signin', { email, password }));
    this.setSession(res);
  }

  async signUp(email: string, password: string): Promise<void> {
    const res = await firstValueFrom(this.http.post<AuthResponse>('/api/auth/signup', { email, password }));
    this.setSession(res);
  }

  signOut(): void {
    localStorage.removeItem('ds_token');
    localStorage.removeItem('ds_user');
    this.user$.next(null);
    this.router.navigate(['/auth']);
  }

  private setSession(res: AuthResponse): void {
    localStorage.setItem('ds_token', res.token);
    localStorage.setItem('ds_user', JSON.stringify(res.user));
    this.user$.next(res.user);
  }
}
