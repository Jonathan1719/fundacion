import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpException,
  HttpStatus,
  Res,
  UseGuards,
  Headers,
} from '@nestjs/common';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { PersonasService } from './personas.service';
import { Persona } from '../entities/persona.entity';
import { CreateBeneficiarioDto } from './dto/create-beneficiario.dto';
import { RolesGuard } from '../auth/roles.guard';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { validarFechaYAnio } from './personas.validator';
import * as XLSX from 'xlsx';
import { NotFoundException } from '@nestjs/common';

@Controller('personas')
@UseGuards(RolesGuard)
export class PersonasController {
  constructor(
    private readonly personasService: PersonasService,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  // 1. OBTENER TODAS LAS PERSONAS
  @Get()
  async findAll(): Promise<Persona[]> {
    return this.personasService.findAll();
  }

  // 2. CATÁLOGO DE PAÍSES
  @Get('catalogo/paises')
  async getPaises() {
    return this.personasService.listarPaises();
  }

  // EXTRA: Método GET especial para limpiar la tabla directo desde el navegador
  @Get('all/force-clear')
  async forceClear() {
    await this.personasService.removeAll();
    return { message: 'Base de datos limpiada con éxito desde el navegador.' };
  }

  // 3. IMPORTAR EXCEL USANDO MATRIZ PURA (INSTRUCTIVO POR ÍNDICES)
  @Post('import/excel')
  @UseInterceptors(FileInterceptor('file'))
  async importExcel(
    @UploadedFile() file: any,
    @Headers('x-user-name') usuarioNombre = 'Sistema/Importación',
  ): Promise<{ message: string; count: number }> {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo');
    }

    try {
      const workbook = XLSX.read(file.buffer, {
        type: 'buffer',
        cellDates: true,
      });

      const sheet = workbook.Sheets[workbook.SheetNames[0]];

      const matrix = XLSX.utils.sheet_to_json<any[]>(sheet, {
        header: 1,
        defval: '',
        raw: false,
      });

      const dataRows = matrix.slice(4);
      const validRows = dataRows.filter(row => row && row.length > 1 && row[1] !== '');

      if (!validRows.length) {
        throw new BadRequestException('No se encontraron filas con datos válidos.');
      }

      const parseDate = (value: any): Date | null => {
        if (!value) return null;
        if (value instanceof Date) return value;
        const date = new Date(value);
        return !isNaN(date.getTime()) ? date : null;
      };

      const parseNumber = (value: any): number | null => {
        if (value === undefined || value === null || value === '') return null;
        const num = Number(value);
        return isNaN(num) ? null : num;
      };

      const personas = validRows.map((row: any[]) => ({
        numero:                       row[0] || null,
        nombres:                      row[1] || null,
        apellidos:                    row[2] || null,
        codigo:                       row[3] || null,
        sexo:                         row[4] || null,
        fecha_ingreso:    parseDate(  row[5]),
        edad_al_ingresar: parseNumber(row[6]),
        cedula:                       row[7] || null,
        fecha_nac:        parseDate(  row[8]),
        edad_actual_anios:  parseNumber(row[9]),
        edad_actual_meses:  parseNumber(row[10]),
        edad_actual_dias:   parseNumber(row[11]),
        ciudad_origen:                row[12] || null,
        direccion:                    row[13] || null,
        telefono_contacto:            row[14] || null,
        representante:                row[15] || null,
        derivado_por:                 row[16] || null,
        modalidad:                    row[17] || null,
        fecha_visita_domiciliaria: parseDate(row[18]),
        tipo_problematica:            row[19] || null,
        fecha_reinsercion_derivacion: parseDate(row[20]),
        observaciones:                row[21] || null,
        codigo_pais:                  '+593',
      }));

      for (const persona of personas) {
        validarFechaYAnio(persona);
      }

      const guardados = await this.personasService.createMany(personas as any);

      await this.auditoriaService.registrar(usuarioNombre, 'IMPORTAR_EXCEL', {
        entidad: 'personas',
        operacion: 'IMPORT',
        cantidad: guardados.length,
        ids: guardados.map((g) => g.id),
      });

      return {
        message: 'Datos importados correctamente',
        count: guardados.length,
      };
    } catch (error: any) {
      throw new BadRequestException({
        message: `Error en importación por matriz: ${error.message}`,
        error: 'Estructura Fallida',
      });
    }
  }

  // 4. ELIMINAR TODOS LOS REGISTROS (Para peticiones DELETE desde frontend)
  @Delete('all')
  async removeAll(
    @Headers('x-user-name') usuarioNombre = 'Sistema/Mantenimiento',
  ): Promise<{ message: string }> {
    try {
      await this.personasService.removeAll();

      await this.auditoriaService.registrar(usuarioNombre, 'LIMPIAR_TABLA_PERSONAS', {
        entidad: 'personas',
        operacion: 'DELETE_ALL',
      });

      return { message: 'Todos los registros de personas han sido eliminados correctamente' };
    } catch (error: any) {
      throw new BadRequestException(`No se pudo vaciar la tabla: ${error.message}`);
    }
  }
 // 5. ELIMINAR UN REGISTRO POR ID (Añadido para el botón eliminar de la tabla)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Headers('x-user-name') usuarioNombre = 'Sistema/Mantenimiento',
  ): Promise<{ message: string }> {
    try {
      // El '+' convierte el string 'id' que viene en la URL a número
      const eliminado = await this.personasService.remove(+id);

      if (!eliminado) {
        throw new HttpException('El beneficiario no existe o ya fue eliminado', HttpStatus.NOT_FOUND);
      }

      // Registramos la auditoría de quién lo borró
      await this.auditoriaService.registrar(usuarioNombre, 'ELIMINAR_PERSONA', {
        entidad: 'personas',
        entidadId: id,
        operacion: 'DELETE_BY_ID',
      });

      return { message: `Persona con ID ${id} eliminada correctamente` };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException('Error al intentar eliminar la persona', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // 5. CREAR UNA PERSONA (para el formulario del frontend)
  @Post()
  async create(
    @Body() dto: CreateBeneficiarioDto,
    @Headers('x-user-name') usuarioNombre = 'Sistema',
  ): Promise<Persona> {
    const createPayload: Partial<Persona> = {
      ...dto,
      fecha_ingreso: dto.fecha_ingreso ? new Date(dto.fecha_ingreso) : undefined,
      fecha_nac: dto.fecha_nac ? new Date(dto.fecha_nac) : undefined,
      fecha_visita_domiciliaria: dto.fecha_visita_domiciliaria ? new Date(dto.fecha_visita_domiciliaria) : undefined,
      fecha_reinsercion_derivacion: dto.fecha_reinsercion_derivacion ? new Date(dto.fecha_reinsercion_derivacion) : undefined,
    };

    const nuevaPersona = await this.personasService.create(createPayload);

    await this.auditoriaService.registrar(usuarioNombre, 'CREAR_PERSONA', {
      entidad: 'personas',
      operacion: 'CREATE',
      id: nuevaPersona.id,
    });

    return nuevaPersona;
  }

 // 6. ACTUALIZAR UNA PERSONA EXISTENTE (si el form también edita)
@Put(':id')
async update(
  @Param('id') id: string,
  @Body() dto: Partial<CreateBeneficiarioDto>,
  @Headers('x-user-name') usuarioNombre = 'Sistema',
): Promise<Persona> {
  const updatePayload: Partial<Persona> = {
    ...dto,
    fecha_ingreso: dto.fecha_ingreso ? new Date(dto.fecha_ingreso) : undefined,
    fecha_nac: dto.fecha_nac ? new Date(dto.fecha_nac) : undefined,
    fecha_visita_domiciliaria: dto.fecha_visita_domiciliaria ? new Date(dto.fecha_visita_domiciliaria) : undefined,
    fecha_reinsercion_derivacion: dto.fecha_reinsercion_derivacion ? new Date(dto.fecha_reinsercion_derivacion) : undefined,
  };

  const actualizada = await this.personasService.update(+id, updatePayload);

  if (!actualizada) {
    throw new NotFoundException(`Persona con id ${id} no encontrada`);
  }

  await this.auditoriaService.registrar(usuarioNombre, 'ACTUALIZAR_PERSONA', {
    entidad: 'personas',
    operacion: 'UPDATE',
    id: +id,
  });

  return actualizada;
}}