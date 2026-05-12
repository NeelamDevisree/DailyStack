import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.css'
})
export class AuthComponent {
  mode: 'signin' | 'signup' = 'signin';
  email = '';
  password = '';
  error = '';
  loading = false;
  showForgot = false;
  forgotSuccess = '';

  constructor(private auth: AuthService, private router: Router) {}

  async submit() {
    this.error = '';
    this.loading = true;
    try {
      if (this.mode === 'signin') {
        await this.auth.signIn(this.email, this.password);
        this.router.navigate(['/']);
      } else {
        await this.auth.signUp(this.email, this.password);
        this.router.navigate(['/onboarding']);
      }
    } catch (err: any) {
      this.error = err?.error?.error || err?.message || 'Something went wrong';
    } finally {
      this.loading = false;
    }
  }

  async sendResetLink() {
    this.error = '';
    this.forgotSuccess = '';
    if (!this.email) {
      this.error = 'Enter your email address';
      return;
    }
    this.loading = true;
    try {
      const msg = await this.auth.forgotPassword(this.email);
      this.forgotSuccess = msg;
    } catch (err: any) {
      this.error = err?.error?.error || 'Failed to send reset link';
    } finally {
      this.loading = false;
    }
  }
}
