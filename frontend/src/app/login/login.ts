
import { Component, Inject, OnInit, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { UsuarioService } from '../services/usuario.service';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
 
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm!: FormGroup;
  mensaje = '';
  error = '';
  cargando = false;
 
  // Modal de aviso de privacidad
  mostrarModal = false;
  mensajePrivacidad = '';
  private pendingRoute: string[] = ['/dashboard'];
 
  private readonly destroy$ = new Subject<void>();
 
  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}
 
  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }
 
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
 
  login(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.error = 'Por favor completa los campos correctamente.';
      return;
    }
 
    this.error = '';
    this.mensaje = '';
    this.cargando = true;
 
    const { email, password } = this.loginForm.value;
 
    this.usuarioService.login(email, password).pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.cargando = false;
      })
    ).subscribe({
      next: (resp: any) => {
        if (isPlatformBrowser(this.platformId)) {
          localStorage.setItem('usuarioNombre', resp.nombreCompleto || resp.usuario || resp.cedula || email);
          localStorage.setItem('usuarioRol', resp.rol || 'USER');
          localStorage.setItem('usuarioId', String(resp.id || ''));
        }
 
        this.mensaje = 'Ingreso correcto.';
 
        // Mostrar modal corporativo de privacidad si el backend lo envía
        if (resp.mensajeSeguridad) {
          this.mensajePrivacidad = resp.mensajeSeguridad;
          this.mostrarModal = true;
 
          // Auto-navegar después de 2 segundos
          setTimeout(() => {
            this.aceptarPrivacidad();
          }, 2000);
        } else {
          this.router.navigate(this.pendingRoute);
        }
      },
      error: (err: any) => {
        // CORRECCIÓN: handleError en usuario.service.ts retorna:
        //   { status, message: <mensaje NestJS>, error: HttpErrorResponse }
        // err.message  = el mensaje real de NestJS (ej: "Tu cuenta está suspendida...")
        // err.error    = HttpErrorResponse de Angular (NO el body JSON)
        // err.error.message = "Http failure response for .../login: 403 Forbidden" (incorrecto)
        // Por eso se lee err.message primero.
        this.error =
          err?.message ||
          err?.error?.error?.message ||
          'Error al iniciar sesión. Verifica tus credenciales.';
      },
    });
  }
 
  // Cierre del modal de privacidad → navegar
  aceptarPrivacidad(): void {
    this.mostrarModal = false;
    this.router.navigate(this.pendingRoute);
  }
}