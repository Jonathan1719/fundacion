import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../entities/usuario.entity';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { SuspendUsuarioDto } from './dto/suspend-usuario.dto';

@Injectable()
export class UsuariosService {
  private readonly logger = new Logger(UsuariosService.name);

  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  // ── Normaliza el estado: si es NULL (usuario existente antes del campo) → 'Activo' ──
  private estadoNormalizado(usuario: Usuario): string {
    return usuario.estado || 'Activo';
  }

  // ── Verifica y actualiza estado si la suspensión expiró ──────────────────
  private async verificarEstadoSuspension(usuario: Usuario): Promise<Usuario> {
    const estado = this.estadoNormalizado(usuario);

    if (
      estado === 'Suspendido' &&
      usuario.fechaFinSuspension !== null &&
      usuario.fechaFinSuspension !== undefined &&
      new Date() > new Date(usuario.fechaFinSuspension)
    ) {
      usuario.estado = 'Activo';
      usuario.fechaInicioSuspension = null;
      usuario.fechaFinSuspension = null;
      await this.usuarioRepository.save(usuario);
      this.logger.log(`Suspensión expirada, usuario reactivado automáticamente: ${usuario.id}`);
    }
    return usuario;
  }

  async guardar(createUsuarioDto: CreateUsuarioDto): Promise<Usuario> {
    try {
      const { nombreCompleto, email, password, rol } = createUsuarioDto;

      if (!nombreCompleto || !email || !password) {
        throw new BadRequestException('Los campos nombreCompleto, email y password son requeridos.');
      }

      const usuarioExistente = await this.usuarioRepository.findOne({
        where: [{ email }, { usuario: email }],
      });

      if (usuarioExistente) {
        throw new ConflictException('El correo electrónico ya está registrado.');
      }

      const passwordEncriptada = await bcrypt.hash(password, 10);

      const nuevoUsuario = this.usuarioRepository.create({
        nombreCompleto,
        email,
        usuario: email,
        password: passwordEncriptada,
        rol,
        cedula: email,
        estado: 'Activo',
      });

      const usuarioGuardado = await this.usuarioRepository.save(nuevoUsuario);

      const usuarioVerificado = await this.usuarioRepository.findOne({
        where: { id: usuarioGuardado.id },
      });

      if (!usuarioVerificado) {
        throw new BadRequestException('Error al verificar el registro.');
      }

      this.logger.log(`Usuario guardado exitosamente: ${usuarioVerificado.id}`);
      return usuarioVerificado;
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) throw error;
      if (error instanceof QueryFailedError && (error as any).driverError?.code === '23505') {
        throw new ConflictException('El correo electrónico o cédula ya está registrado.');
      }
      this.logger.error(`Error al guardar usuario: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      throw new BadRequestException('Error al registrar usuario. Por favor intente nuevamente.');
    }
  }

  async listar(): Promise<Usuario[]> {
    try {
      const usuarios = await this.usuarioRepository.find();
      // Verificar y actualizar suspensiones expiradas; normalizar estado NULL → 'Activo'
      for (const u of usuarios) {
        if (!u.estado) {
          u.estado = 'Activo';
          await this.usuarioRepository.save(u);
        } else {
          await this.verificarEstadoSuspension(u);
        }
      }
      return this.usuarioRepository.find();
    } catch (error) {
      this.logger.error(`Error al listar usuarios: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      throw new BadRequestException('Error al obtener la lista de usuarios.');
    }
  }

  async login(usuario: string, password: string): Promise<any> {
    if (!usuario || !password) {
      throw new BadRequestException('Usuario y contraseña son requeridos.');
    }

    const usuarioEncontrado = await this.usuarioRepository.findOne({
      where: [
        { usuario },
        { email: usuario },
        { cedula: usuario },
      ],
    });

    if (!usuarioEncontrado) {
      this.logger.warn(`Intento de login con usuario no encontrado: ${usuario}`);
      throw new UnauthorizedException('Usuario o contraseña incorrectos.');
    }

    // Normalizar estado NULL a 'Activo' (usuarios creados antes del campo)
    if (!usuarioEncontrado.estado) {
      usuarioEncontrado.estado = 'Activo';
      await this.usuarioRepository.save(usuarioEncontrado);
    }

    // Verificar si la suspensión temporal expiró
    await this.verificarEstadoSuspension(usuarioEncontrado);

    // Recargar para tener estado actualizado tras posible reactivación automática
    const usuarioActual = await this.usuarioRepository.findOne({
      where: { id: usuarioEncontrado.id },
    });

    if (!usuarioActual) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos.');
    }

    // ── BLOQUEAR LOGIN si está suspendido ───────────────────────────────────
    if (this.estadoNormalizado(usuarioActual) === 'Suspendido') {
      const esPermanente =
        usuarioActual.fechaFinSuspension === null ||
        usuarioActual.fechaFinSuspension === undefined;

      const mensaje = esPermanente
        ? 'Su cuenta ha sido suspendida permanentemente. Contacte al administrador.'
        : `Su cuenta está suspendida hasta el ${new Date(usuarioActual.fechaFinSuspension!).toLocaleDateString(
            'es-EC',
            { day: '2-digit', month: '2-digit', year: 'numeric' },
          )}.`;

      this.logger.warn(`Login bloqueado por suspensión: ${usuario}`);
      throw new ForbiddenException(mensaje);
    }

    // ── Verificar contraseña ────────────────────────────────────────────────
    const passwordValida = await bcrypt.compare(password, usuarioActual.password || '');

    if (!passwordValida) {
      this.logger.warn(`Intento de login con contraseña incorrecta para usuario: ${usuario}`);
      throw new UnauthorizedException('Usuario o contraseña incorrectos.');
    }

    return {
      id: usuarioActual.id,
      cedula: usuarioActual.cedula,
      usuario: usuarioActual.usuario,
      rol: usuarioActual.rol,
      nombreCompleto: usuarioActual.nombreCompleto,
      email: usuarioActual.email,
      mensajeSeguridad:
        'AVISO DE PRIVACIDAD Y SEGURIDAD DE DATOS (Cumplimiento LOPD):\n\nLos datos recopilados en esta plataforma son estrictamente confidenciales y de uso exclusivo de esta institución de apoyo social. Al acceder al sistema, usted se compromete a respetar las políticas de protección de datos personales vigentes y evitar cualquier divulgación no autorizada de la información de los ciudadanos beneficiarios.',
    };
  }

  async suspender(id: string, suspendDto: SuspendUsuarioDto, rolSolicitante: string): Promise<Usuario> {
    const rolesPermitidos = ['MASTER', 'ADMIN'];
    if (!rolesPermitidos.includes(rolSolicitante.toUpperCase())) {
      throw new ForbiddenException('No tiene permisos para suspender usuarios.');
    }

    const usuarioId = parseInt(id, 10);
    if (isNaN(usuarioId)) throw new BadRequestException('ID de usuario inválido.');

    const usuario = await this.usuarioRepository.findOne({ where: { id: usuarioId } });
    if (!usuario) throw new NotFoundException(`Usuario con ID ${usuarioId} no encontrado.`);

    const ahora = new Date();
    let fechaFin: Date | null = null;

    switch (suspendDto.duracion) {
      case '1d':        fechaFin = new Date(ahora.getTime() + 1  * 24 * 60 * 60 * 1000); break;
      case '3d':        fechaFin = new Date(ahora.getTime() + 3  * 24 * 60 * 60 * 1000); break;
      case '7d':        fechaFin = new Date(ahora.getTime() + 7  * 24 * 60 * 60 * 1000); break;
      case '15d':       fechaFin = new Date(ahora.getTime() + 15 * 24 * 60 * 60 * 1000); break;
      case '30d':       fechaFin = new Date(ahora.getTime() + 30 * 24 * 60 * 60 * 1000); break;
      case 'permanente': fechaFin = null; break;
    }

    usuario.estado = 'Suspendido';
    usuario.fechaInicioSuspension = ahora;
    usuario.fechaFinSuspension = fechaFin;

    const guardado = await this.usuarioRepository.save(usuario);
    this.logger.log(`Usuario ${usuarioId} suspendido (${suspendDto.duracion}) por rol ${rolSolicitante}`);
    return guardado;
  }

  async reactivar(id: string, rolSolicitante: string): Promise<Usuario> {
    const rolesPermitidos = ['MASTER', 'ADMIN'];
    if (!rolesPermitidos.includes(rolSolicitante.toUpperCase())) {
      throw new ForbiddenException('No tiene permisos para reactivar usuarios.');
    }

    const usuarioId = parseInt(id, 10);
    if (isNaN(usuarioId)) throw new BadRequestException('ID de usuario inválido.');

    const usuario = await this.usuarioRepository.findOne({ where: { id: usuarioId } });
    if (!usuario) throw new NotFoundException(`Usuario con ID ${usuarioId} no encontrado.`);

    usuario.estado = 'Activo';
    usuario.fechaInicioSuspension = null;
    usuario.fechaFinSuspension = null;

    const guardado = await this.usuarioRepository.save(usuario);
    this.logger.log(`Usuario ${usuarioId} reactivado por rol ${rolSolicitante}`);
    return guardado;
  }
}