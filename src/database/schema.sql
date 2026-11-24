-- ============================================================================
-- DISEÑO RELACIONAL DE BASE DE DATOS - INSTITUCIÓN DE APOYO SOCIAL
-- ============================================================================

-- 1. Tabla de Catálogo de Países (Códigos telefónicos y registros)
CREATE TABLE paises (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(10) NOT NULL UNIQUE,       -- Ejemplo: 'EC', 'CO', 'PE'
    prefijo VARCHAR(10) NOT NULL UNIQUE       -- Ejemplo: '+593', '+57', '+51'
);

-- Inserción de catálogo inicial de países de la región
INSERT INTO paises (nombre, codigo, prefijo) VALUES 
('Ecuador', 'EC', '+593'),
('Colombia', 'CO', '+57'),
('Perú', 'PE', '+51'),
('Venezuela', 'VE', '+58'),
('España', 'ES', '+34'),
('Estados Unidos', 'US', '+1'),
('Argentina', 'AR', '+54'),
('México', 'MX', '+52'),
('Chile', 'CL', '+56'),
('Bolivia', 'BO', '+591');

-- 2. Tabla de Usuarios de la Institución (Personal que opera el sistema)
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    cedula VARCHAR(20) NOT NULL UNIQUE,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL DEFAULT 'USER' CHECK (rol IN ('ADMIN', 'USER'))
);

-- 3. Tabla de Recepcionista / Registrador (Personal que recopila datos y registra motivos)
CREATE TABLE recepcionistas (
    id SERIAL PRIMARY KEY,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    cedula VARCHAR(20) NOT NULL UNIQUE,
    motivos_apoyo TEXT,                       -- Registro de los motivos del apoyo que gestiona
    usuario_id INT,                           -- Cuenta de usuario asociada (opcional)
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- 4. Tabla de Personas Beneficiarias (Ciudadanos que reciben el apoyo)
CREATE TABLE personas (
    id SERIAL PRIMARY KEY,
    numero INT,
    nombres VARCHAR(100) NOT NULL,
    apellidos VARCHAR(100) NOT NULL,
    codigo VARCHAR(50),
    sexo VARCHAR(20),
    fecha_ingreso DATE,
    edad_al_ingresar INT,
    cedula VARCHAR(20),
    fecha_nac DATE,
    edad_actual_anios INT,
    edad_actual_meses INT,
    edad_actual_dias INT,
    ciudad_origen VARCHAR(100),
    direccion VARCHAR(255),
    telefono_contacto VARCHAR(50),
    representante_derivado_por VARCHAR(150),
    modalidad VARCHAR(100),
    fecha_visita_domiciliaria DATE,
    tipo_problematica VARCHAR(150),
    fecha_reinsercion_derivacion DATE,
    observaciones TEXT,
    
    -- Campos agregados obligatorios según requerimientos
    codigo_pais VARCHAR(10) NOT NULL DEFAULT '+593', -- Código de país obligatorio
    anio_apoyo INT CHECK (anio_apoyo BETWEEN 1 AND 100), -- Rango estricto de año de apoyo/ciclo (1-100)
    recepcionista_id INT, -- Registrador o recepcionista a cargo
    
    FOREIGN KEY (recepcionista_id) REFERENCES recepcionistas(id) ON DELETE SET NULL
);

-- 5. Tabla de Seguimiento de Acciones / Auditoría
CREATE TABLE auditoria (
    id SERIAL PRIMARY KEY,
    accion VARCHAR(100) NOT NULL,             -- Ejemplo: 'CREAR_PERSONA', 'MODIFICAR_PERSONA'
    usuario VARCHAR(50) NOT NULL,             -- Usuario que realizó la acción
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- Fecha y hora del evento
    detalles JSONB                            -- Diccionario de datos/JSON track del historial de cambios
);
