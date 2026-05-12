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
}
