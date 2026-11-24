import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Component, Inject, OnInit, OnDestroy, PLATFORM_ID } from '@angular/core';
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
import { UsuarioService } from '../services/usuario.service';
import { Subscription, Subject, forkJoin } from 'rxjs';
import { takeUntil, finalize, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

// ── Validador: fecha no posterior a 2026 ─────────────────────────────────
function maxYearValidator(maxYear: number): ValidatorFn {
  return (ctrl: AbstractControl): ValidationErrors | null => {
    if (!ctrl.value) return null;
    const d = new Date(ctrl.value);
    if (isNaN(d.getTime())) return { invalidDate: true };
    return d.getFullYear() > maxYear ? { maxYearExceeded: true } : null;
  };
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit, OnDestroy {
  // ── Sesión ──────────────────────────────────────────────────────────────
  usuarioNombre = '';
  usuarioRol = '';
  usuarioId = '';
  adminMensaje = '';

  get esAdmin(): boolean {
    return this.usuarioRol.toUpperCase() === 'ADMIN';
  }

  get esMASTER(): boolean {
    return this.usuarioRol.toUpperCase() === 'MASTER';
  }

  get puedeGestionarUsuarios(): boolean {
    return this.esAdmin || this.esMASTER;
  }

  get saludoNombre(): string {
    return this.usuarioNombre.split(' ')[0];
  }

  // ── Datos ────────────────────────────────────────────────────────────────
  personas: any[] = [];
  paises: any[] = [];
  usuariosRegistrados: any[] = [];
  archivoNombre = '';
  success = '';
  error = '';

  // ── Control de visibilidad tabla Excel ───────────────────────────────────
  mostrarTablaExcel = false;
  tablaExcelImportada = false; // true cuando hay datos recién importados

  // ── Modal suspensión ─────────────────────────────────────────────────────
  modalAbierto = false;
  usuarioSeleccionado: any = null;
  duracionSeleccionada = '';
  readonly opcionesDuracion = [
    { valor: '1d',         etiqueta: '1 día' },
    { valor: '3d',         etiqueta: '3 días' },
    { valor: '7d',         etiqueta: '7 días' },
    { valor: '15d',        etiqueta: '15 días' },
    { valor: '30d',        etiqueta: '30 días' },
    { valor: 'permanente', etiqueta: 'Permanente' },
  ];

  // ── Formulario Reactivo ──────────────────────────────────────────────────
  form!: FormGroup;
  cargando = false;

  private subNac?: Subscription;
  private readonly destroy$ = new Subject<void>();
  readonly sexos = ['Masculino', 'Femenino', 'Otro'];
  private readonly apiUrl = 'http://localhost:3000/personas';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router,
    private usuarioService: UsuarioService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  ngOnInit(): void {
    this.cargarSesion();
    this.buildForm();
    this.watchFechaNac();
    this.cargarDatosInicial();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.subNac?.unsubscribe();
  }

  private cargarDatosInicial(): void {
    const catalogos$ = this.http
      .get<any[]>(`${this.apiUrl}/catalogo/paises`, this.getHeaders())
      .pipe(catchError(() => of([])), takeUntil(this.destroy$));

    const personas$ = this.http
      .get<any[]>(this.apiUrl, this.getHeaders())
      .pipe(catchError(() => of([])), takeUntil(this.destroy$));

    forkJoin([catalogos$, personas$])
      .pipe(
        finalize(() => {
          if (this.puedeGestionarUsuarios) this.cargarUsuariosRegistrados();
        }),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (data: any[]) => {
          const [paises, personas] = data;
          this.paises = paises?.length ? paises : [{ id: 1, nombre: 'Ecuador (+593)' }];
          this.personas = personas ?? [];
          // La tabla de personas del Excel NO se muestra automáticamente al iniciar
          this.mostrarTablaExcel = false;
          this.tablaExcelImportada = false;
        },
        error: () => {
          this.paises = [{ id: 1, nombre: 'Ecuador (+593)' }];
          this.personas = [];
        },
      });
  }

  // ── Sesión ───────────────────────────────────────────────────────────────
  private cargarSesion(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.usuarioNombre = localStorage.getItem('usuarioNombre') || 'Usuario';
      this.usuarioRol    = localStorage.getItem('usuarioRol')    || 'USER';
      this.usuarioId     = localStorage.getItem('usuarioId')     || '';
      this.adminMensaje  = this.esAdmin ? 'Administrador en línea' : '';
    }
  }

  private getHeaders() {
    return {
      headers: {
        'x-user-role': this.usuarioRol || 'USER',
        'x-user-name': this.usuarioNombre || 'Anonimo',
      },
    };
  }

  cerrarSesion(): void {
    if (isPlatformBrowser(this.platformId)) localStorage.clear();
    this.router.navigate(['/login']);
  }

  // ── Modal Suspensión ─────────────────────────────────────────────────────
  abrirModalSuspender(usuario: any): void {
    this.usuarioSeleccionado = usuario;
    this.duracionSeleccionada = '';
    this.modalAbierto = true;
    this.error = '';
    this.success = '';
  }

  cerrarModal(): void {
    this.modalAbierto = false;
    this.usuarioSeleccionado = null;
    this.duracionSeleccionada = '';
  }

  confirmarSuspension(): void {
    if (!this.duracionSeleccionada) {
      this.error = 'Selecciona una duración para la suspensión.';
      return;
    }
    this.usuarioService
      .suspenderUsuario(this.usuarioSeleccionado.id, this.duracionSeleccionada, this.usuarioRol)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.success = `Usuario "${this.usuarioSeleccionado.nombreCompleto || this.usuarioSeleccionado.email}" suspendido correctamente.`;
          this.cerrarModal();
          this.cargarUsuariosRegistrados();
        },
        error: (err: any) => {
          this.error = err?.message || 'No se pudo suspender el usuario.';
          this.cerrarModal();
        },
      });
  }

  reactivarUsuario(usuario: any): void {
    this.error = '';
    this.success = '';
    this.usuarioService
      .reactivarUsuario(usuario.id, this.usuarioRol)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.success = `Usuario "${usuario.nombreCompleto || usuario.email}" reactivado correctamente.`;
          this.cargarUsuariosRegistrados();
        },
        error: (err: any) => {
          this.error = err?.message || 'No se pudo reactivar el usuario.';
        },
      });
  }

  tiempoRestante(usuario: any): string {
    if (usuario.estado !== 'Suspendido') return '—';
    if (!usuario.fechaFinSuspension) return 'Permanente';
    const fin = new Date(usuario.fechaFinSuspension);
    const ahora = new Date();
    const diff = fin.getTime() - ahora.getTime();
    if (diff <= 0) return 'Expirando...';
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (dias > 0) return `${dias}d ${horas}h`;
    const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${horas}h ${minutos}m`;
  }

  // ── Tabla Excel ──────────────────────────────────────────────────────────
  mostrarTabla(): void {
    this.mostrarTablaExcel = true;
  }

  ocultarTabla(): void {
    this.mostrarTablaExcel = false;
  }

  // ── Formulario ───────────────────────────────────────────────────────────
  private buildForm(): void {
    const dv = [maxYearValidator(2026)];
    this.form = this.fb.group({
      numero:             [null],
      nombres:            ['', [Validators.required, Validators.minLength(3)]],
      apellidos:          ['', [Validators.required, Validators.minLength(3)]],
      codigo:             [''],
      sexo:               [''],
      fecha_ingreso:      ['', dv],
      edad_al_ingresar:   [null, [Validators.min(0)]],
      cedula:             [''],
      fecha_nac:          ['', dv],
      edad_actual_anios:  [{ value: null, disabled: true }],
      edad_actual_meses:  [{ value: null, disabled: true }],
      edad_actual_dias:   [{ value: null, disabled: true }],
      ciudad_origen:      [''],
      direccion:          [''],
      codigo_pais:                ['+593', [Validators.required]],
      telefono_contacto:          [''],
      representante:              [''],
      derivado_por:               [''],
      modalidad:                  [''],
      fecha_visita_domiciliaria:  ['', dv],
      tipo_problematica:            [''],
      fecha_reinsercion_derivacion: ['', dv],
      observaciones: [''],
    });
  }

  private watchFechaNac(): void {
    this.subNac = this.form.get('fecha_nac')!.valueChanges.subscribe(val => {
      if (!val) {
        this.form.patchValue({ edad_actual_anios: null, edad_actual_meses: null, edad_actual_dias: null }, { emitEvent: false });
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
        { edad_actual_anios: Math.max(0, Math.min(y, 120)), edad_actual_meses: Math.max(0, Math.min(m, 11)), edad_actual_dias: Math.max(0, Math.min(d, 31)) },
        { emitEvent: false },
      );
    });
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!(c && c.invalid && (c.dirty || c.touched));
  }

  agregarPersona(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error   = 'Complete correctamente los campos obligatorios (*).';
      this.success = '';
      return;
    }
    this.error   = '';
    this.success = '';
    this.cargando = true;

    const raw = this.form.getRawValue();
    ['fecha_ingreso', 'fecha_nac', 'fecha_visita_domiciliaria', 'fecha_reinsercion_derivacion']
      .forEach(f => { if (!raw[f]) raw[f] = null; });

    this.http.post(this.apiUrl, raw, this.getHeaders()).pipe(
      finalize(() => { this.cargando = false; }),
      takeUntil(this.destroy$),
    ).subscribe({
      next: (r: any) => {
        this.success  = `Persona registrada con éxito${r?.id ? ' — ID: ' + r.id : ''}.`;
        this.form.reset({ codigo_pais: '+593' });
        // Al agregar persona manualmente, la tabla Excel NO aparece
        this.mostrarTablaExcel = false;
        this.cargarPersonas();
      },
      error: err => {
        this.error = err?.error?.message ?? 'Error al registrar. Intente nuevamente.';
      },
    });
  }

  // ── Datos ────────────────────────────────────────────────────────────────
  cargarPersonas(): void {
    this.http.get<any[]>(this.apiUrl, this.getHeaders()).pipe(
      takeUntil(this.destroy$),
    ).subscribe({
      next: d => (this.personas = d || []),
      error: ()  => (this.error = 'Error cargando personas.'),
    });
  }

  cargarUsuariosRegistrados(): void {
    this.usuarioService.listarUsuarios().pipe(
      takeUntil(this.destroy$),
    ).subscribe({
      next: (d: any) => (this.usuariosRegistrados = Array.isArray(d) ? d : []),
      error: ()       => (this.usuariosRegistrados = []),
    });
  }

  eliminarPersona(id: number): void {
    if (!confirm('¿Eliminar este beneficiario? Esta acción no se puede deshacer.')) return;
    this.http.delete(`${this.apiUrl}/${id}`, this.getHeaders()).pipe(
      takeUntil(this.destroy$),
    ).subscribe({
      next: () => { this.success = 'Beneficiario eliminado.'; this.cargarPersonas(); },
      error: err => { this.error = err?.error?.message || 'Error al eliminar.'; },
    });
  }

  // ── Excel ────────────────────────────────────────────────────────────────
  seleccionarExcel(): void {
    (document.getElementById('excelInput') as HTMLInputElement)?.click();
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.archivoNombre = file.name;
    const fd = new FormData();
    fd.append('file', file);
    this.http.post(`${this.apiUrl}/import/excel`, fd, this.getHeaders()).pipe(
      takeUntil(this.destroy$),
    ).subscribe({
      next: (r: any) => {
        this.success = `${r.message} (${r.count} registros)`;
        // Al importar Excel, mostrar la tabla automáticamente
        this.mostrarTablaExcel = true;
        this.tablaExcelImportada = true;
        this.cargarPersonas();
      },
      error: err => { this.error = err?.error?.message || 'Error importando Excel.'; },
    });
  }

  exportarExcel(): void {
    this.http.get(`${this.apiUrl}/export/excel`, {
      headers: { 'x-user-role': this.usuarioRol, 'x-user-name': this.usuarioNombre },
      responseType: 'arraybuffer',
    }).pipe(
      takeUntil(this.destroy$),
    ).subscribe({
      next: data => {
        const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `personas_${Date.now()}.xlsx`;
        a.click();
        this.success = 'Excel descargado correctamente.';
      },
      error: () => (this.error = 'Error exportando Excel.'),
    });
  }
}
