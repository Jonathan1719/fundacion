import { BadRequestException } from '@nestjs/common';

export function validarFechaYAnio(datos: any): void {
  const anioEnCurso = new Date().getFullYear();

  // 1. Validaciones de Fecha
  // Se validan todos los campos que contengan fechas
  const camposFecha = [
    'fecha_ingreso',
    'fecha_nac',
    'fecha_visita_domiciliaria',
    'fecha_reinsercion_derivacion'
  ];

  for (const campo of camposFecha) {
    if (datos[campo]) {
      const fecha = new Date(datos[campo]);
      
      // Verificar si es una fecha válida
      if (isNaN(fecha.getTime())) {
        throw new BadRequestException(`El campo ${campo} no contiene una fecha válida.`);
      }

      // Validar que no supere el año en curso
      if (fecha.getFullYear() > anioEnCurso) {
        throw new BadRequestException(
          `Error en campo ${campo}: La fecha ingresada (${fecha.getFullYear()}) no puede superar el año en curso (${anioEnCurso}).`
        );
      }
    }
  }

  // 2. Validaciones de Campo de Año (Rango estricto entre 1 y 100)
  if (datos.anio_apoyo !== undefined && datos.anio_apoyo !== null && datos.anio_apoyo !== '') {
    const anio = Number(datos.anio_apoyo);

    if (isNaN(anio) || !Number.isInteger(anio)) {
      throw new BadRequestException('El campo Año debe ser un número entero válido.');
    }

    if (anio < 1 || anio > 100) {
      throw new BadRequestException(
        `Error en campo Año: El año ingresado (${anio}) debe estar estrictamente dentro del rango de 1 a 100 máximo.`
      );
    }
  }
}
