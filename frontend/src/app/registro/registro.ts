import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { UsuarioService } from '../services/usuario.service';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrl: './registro.css'
})
export class RegistroComponent implements OnInit, OnDestroy {
  registroForm!: FormGroup;
  mensaje = '';
  error = '';
  cargando = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.registroForm = this.fb.group({
      nombreCompleto: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
        ]
      ],
      email: ['', [Validators.required, Validators.email]],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!._\-*?])[A-Za-z\d@#$%^&+=!._\-*?]{8,}$/)
        ]
      ],
      rol: ['USER', [Validators.required]]
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  registrar(): void {
    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      this.error = 'Por favor completa los campos correctamente.';
      return;
    }

    this.mensaje = '';
    this.error = '';
    this.cargando = true;

    this.usuarioService.guardar(this.registroForm.value).pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.cargando = false;
      })
    ).subscribe({
      next: (resp: any) => {
        const numeroRegistro = resp?.id ? ` Número de registro: ${resp.id}.` : '';
        this.mensaje = `Usuario registrado correctamente.${numeroRegistro}`;
        localStorage.setItem('usuarioNombre', this.registroForm.get('nombreCompleto')?.value || '');
        console.log(resp);
        
        // Redirigir al login después de 1.5 segundos
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.message || 'No se pudo registrar el usuario. Revisa la conexión o usa otro correo.';
        console.error(err);
      },
    });
  }
}