-- Verificar si el rol MASTER existe en la tabla usuario (si existe una columna rol)
-- Si la tabla usuario tiene una columna "rol", agregar la opción MASTER

-- Script de inicialización para rol MASTER
-- Este script debe ejecutarse después de crear la tabla usuario

-- Comentario: Los roles disponibles son: ADMIN, USER, MASTER
-- - ADMIN: Acceso total al sistema y gestión de usuarios
-- - USER: Acceso a registrar y consultar personas
-- - MASTER: Seguimiento y auditoría de todas las personas registradas

-- Si necesitas insertar un usuario MASTER manualmente, usa:
-- INSERT INTO "usuario" (nombreCompleto, email, usuario, password, rol, cedula) 
-- VALUES ('Master de Seguimiento', 'master@fundacion.local', 'master', 'password123', 'MASTER', 'MASTER-001')
-- ON CONFLICT (email) DO NOTHING;

-- Para el seeding automático en la aplicación, el rol MASTER se crea en el servicio de usuarios
-- cuando se detecta que no existe ningún usuario MASTER en el sistema.
