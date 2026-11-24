import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

// ─── Validador: año de fecha ≤ 2026 ──────────────────────────────────────────
function maxYearValidator(maxYear: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const date = new Date(control.value);
    if (isNaN(date.getTime())) return { invalidDate: true };
    if (date.getFullYear() > maxYear) return { maxYearExceeded: true };
    return null;
  };
}

@Component({
  selector: 'app-personas',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './personas.html',
  styleUrl: './personas.css',
})
export class PersonasComponent implements OnInit, OnDestroy {
  form!: FormGroup;
  mensajeExito = '';
  mensajeError = '';
  cargando = false;

  // ── Sesión ─────────────────────────────────────────────────────────────────
  usuarioNombre = 'Usuario';
  usuarioRol: 'ADMIN' | 'USER' = 'USER';
  usuarioId = '';

  // ── Catálogos ──────────────────────────────────────────────────────────────
  paises: any[] = [];
  readonly sexos = ['Masculino', 'Femenino', 'Otro'];

  // ── Modal de privacidad ────────────────────────────────────────────────────
  mostrarModalPrivacidad = false;

  private subNac?: Subscription;
  private readonly apiUrl = 'http://localhost:3000/personas';
  private readonly apiUsuarios = 'http://localhost:3000/usuarios';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngOnInit(): void {
    this.cargarSesion();
    this.buildForm();
    this.loadCatalogos();
    this.watchFechaNac();
  }

  ngOnDestroy(): void {
    this.subNac?.unsubscribe();
  }

  // ── 1. Recupera sesión desde localStorage ─────────────────────────────────
  private cargarSesion(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.usuarioNombre = localStorage.getItem('usuarioNombre') || 'Usuario';
      this.usuarioRol    = (localStorage.getItem('usuarioRol') as 'ADMIN' | 'USER') || 'USER';
      this.usuarioId     = localStorage.getItem('usuarioId') || '';
    }
  }

  // ── 2. Getters útiles de sesión ────────────────────────────────────────────
  get esAdmin(): boolean {
    return this.usuarioRol === 'ADMIN';
  }

  get saludoNombre(): string {
    // Muestra solo el primer nombre para que quede elegante
    return this.usuarioNombre.split(' ')[0];
  }

  // ── 3. Cerrar sesión ───────────────────────────────────────────────────────
  cerrarSesion(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('usuarioNombre');
      localStorage.removeItem('usuarioRol');
      localStorage.removeItem('usuarioId');
    }
    this.router.navigate(['/login']);
  }

  // ── 4. Eliminar cuenta (solo ADMIN) ───────────────────────────────────────
  eliminarCuenta(): void {
    if (!this.esAdmin || !this.usuarioId) return;

    const confirmado = confirm(
      `⚠️ ACCIÓN IRREVERSIBLE\n\n¿Está seguro de que desea eliminar permanentemente la cuenta "${this.usuarioNombre}"?\n\nEsta acción no se puede deshacer.`,
    );
    if (!confirmado) return;

    this.http.delete(`${this.apiUsuarios}/${this.usuarioId}`).subscribe({
      next: () => {
        if (isPlatformBrowser(this.platformId)) {
          localStorage.clear();
        }
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.mensajeError =
          err?.error?.message ?? 'No se pudo eliminar la cuenta. Intente nuevamente.';
      },
    });
  }

  // ── 5. Formulario ──────────────────────────────────────────────────────────
  private buildForm(): void {
    const dateV = [maxYearValidator(2026)];
    this.form = this.fb.group({
      // Fila 1
      numero:             [null],
      nombres:            ['', [Validators.required, Validators.minLength(3)]],
      apellidos:          ['', [Validators.required, Validators.minLength(3)]],
      codigo:             [''],
      sexo:               [''],
      fecha_ingreso:      ['', dateV],
      edad_al_ingresar:   [null, [Validators.min(0)]],
      // Fila 2
      cedula:             ['', [Validators.required, Validators.minLength(3)]],
      fecha_nac:          ['', dateV],
      edad_actual_anios:  [{ value: null, disabled: true }],
      edad_actual_meses:  [{ value: null, disabled: true }],
      edad_actual_dias:   [{ value: null, disabled: true }],
      ciudad_origen:      [''],
      direccion:          [''],
      // Fila 3
      codigo_pais:                ['+593', [Validators.required]],
      telefono_contacto:          [''],
      representante:              [''],
      derivado_por:               [''],
      modalidad:                  [''],
      fecha_visita_domiciliaria:  ['', dateV],
      // Fila 4
      tipo_problematica:            [''],
      fecha_reinsercion_derivacion: ['', dateV],
      // Fila 5
      observaciones: [''],
    });
  }

  // ── 6. Catálogos ───────────────────────────────────────────────────────────
  private loadCatalogos(): void {
    this.http.get<any[]>(`${this.apiUrl}/catalogo/paises`).subscribe({
      next: (d) => { this.paises = d?.length ? d : [{ id: 1, nombre: 'Ecuador (+593)' }]; },
      error: () => { this.paises = [{ id: 1, nombre: 'Ecuador (+593)' }]; },
    });
  }

  // ── 7. Auto-cálculo de edad ────────────────────────────────────────────────
  private watchFechaNac(): void {
    this.subNac = this.form.get('fecha_nac')!.valueChanges.subscribe((val) => {
      if (!val) {
        this.form.patchValue(
          { edad_actual_anios: null, edad_actual_meses: null, edad_actual_dias: null },
          { emitEvent: false },
        );
        return;
      }
      const birth = new Date(val);
      if (isNaN(birth.getTime())) return;

      const today = new Date();
      let y = today.getFullYear() - birth.getFullYear();
      let m = today.getMonth()    - birth.getMonth();
      let d = today.getDate()     - birth.getDate();
      if (d < 0) { m--; d += new Date(today.getFullYear(), today.getMonth(), 0).getDate(); }
      if (m < 0) { y--; m += 12; }

      this.form.patchValue(
        {
          edad_actual_anios: Math.max(0, Math.min(y, 120)),
          edad_actual_meses: Math.max(0, Math.min(m, 11)),
          edad_actual_dias:  Math.max(0, Math.min(d, 31)),
        },
        { emitEvent: false },
      );
    });
  }

  // ── 8. Helpers de template ─────────────────────────────────────────────────
  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  // ── 9. Submit ─────────────────────────────────────────────────────────────
  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.mensajeError = 'Complete correctamente los campos obligatorios (*).';
      return;
    }

    this.mensajeExito = '';
    this.mensajeError = '';
    this.cargando = true;

    const raw = this.form.getRawValue();
    ['fecha_ingreso', 'fecha_nac', 'fecha_visita_domiciliaria', 'fecha_reinsercion_derivacion']
      .forEach((f) => { if (!raw[f]) raw[f] = null; });

    this.http.post(this.apiUrl, raw).subscribe({
      next: (r: any) => {
        this.cargando     = false;
        this.mensajeExito = `Persona registrada con éxito${r?.id ? ' — ID: ' + r.id : ''}.`;
        this.form.reset({ codigo_pais: '+593' });
      },
      error: (err) => {
        this.cargando     = false;
        this.mensajeError = err?.error?.message ?? 'Error al registrar. Intente nuevamente.';
      },
    });
  }
}
