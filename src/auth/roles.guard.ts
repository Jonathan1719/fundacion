import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class RolesGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    
    // Obtener el rol del usuario desde las cabeceras x-user-role o x-usuario-rol
    const userRole = (
      request.headers['x-user-role'] || 
      request.headers['x-usuario-rol'] || 
      'USER'
    ).toString().toUpperCase();

    // Permitir acceso libre a rutas de registro y login
    if (request.url.includes('/usuarios/login') || request.url.includes('/usuarios') && method === 'POST' && !request.url.includes('/personas')) {
      return true;
    }

    // 1. Acciones de Lectura (GET) y Creación (POST): ADMIN y USER permitidos
    if (method === 'GET' || method === 'POST') {
      return true;
    }

    // 2. Acciones de Modificación (PUT/PATCH) y Eliminación (DELETE): Solo ADMIN permitido
    if (method === 'PUT' || method === 'PATCH' || method === 'DELETE') {
      if (userRole === 'ADMIN') {
        return true;
      }
      throw new ForbiddenException('Acceso denegado: Solo el perfil Administrador (ADMIN) puede actualizar o eliminar registros.');
    }

    return false;
  }
}
