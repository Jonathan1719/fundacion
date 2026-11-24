import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsInt,
  IsDateString,
  MinLength,
} from 'class-validator';

// ─── Decorador personalizado: año de fecha ≤ 2026 ──────────────────────────
export function IsNotAfterYear(
  year: number,
  validationOptions?: ValidationOptions,
) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isNotAfterYear',
      target: object.constructor,
      propertyName,
      constraints: [year],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (value === null || value === undefined || value === '') return true;
          const date = new Date(value);
          if (isNaN(date.getTime())) return false;
          return date.getFullYear() <= args.constraints[0];
        },
        defaultMessage(args: ValidationArguments) {
          return `El campo "${args.property}" no puede superar el año ${args.constraints[0]}.`;
        },
      },
    });
  };
}

// ─── DTO ───────────────────────────────────────────────────────────────────
export class CreateBeneficiarioDto {
  @IsOptional()
  @IsInt({ message: 'El Nº debe ser un número entero.' })
  numero?: number;

  @IsNotEmpty({ message: 'El campo Nombres es obligatorio.' })
  @IsString()
  @MinLength(3, { message: 'Nombres debe tener al menos 3 caracteres.' })
  nombres!: string;

  @IsNotEmpty({ message: 'El campo Apellidos es obligatorio.' })
  @IsString()
  @MinLength(3, { message: 'Apellidos debe tener al menos 3 caracteres.' })
  apellidos!: string;

  @IsOptional()
  @IsString()
  codigo?: string;

  @IsOptional()
  @IsString()
  sexo?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Fecha de Ingreso debe ser una fecha válida.' })
  @IsNotAfterYear(2026, { message: 'Fecha de Ingreso no puede superar el año 2026.' })
  fecha_ingreso?: string;

  @IsOptional()
  @IsInt({ message: 'Edad al Ingresar debe ser un entero positivo.' })
  @Min(0)
  edad_al_ingresar?: number;

  @IsOptional()
  @IsString()
  cedula?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Fecha de Nacimiento debe ser una fecha válida.' })
  @IsNotAfterYear(2026, { message: 'Fecha de Nacimiento no puede superar el año 2026.' })
  fecha_nac?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(120, { message: 'Edad Actual Años no puede superar 120.' })
  edad_actual_anios?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(11, { message: 'Edad Actual Meses debe estar entre 0 y 11.' })
  edad_actual_meses?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(31, { message: 'Edad Actual Días debe estar entre 0 y 31.' })
  edad_actual_dias?: number;

  @IsOptional()
  @IsString()
  ciudad_origen?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsNotEmpty({ message: 'El Código País es obligatorio.' })
  @IsString()
  codigo_pais!: string;

  @IsOptional()
  @IsString()
  telefono_contacto?: string;


  
  @IsOptional()
  @IsString()
  representante?: string;

  @IsOptional()
  @IsString()
  derivado_por?: string;

  @IsOptional()
  @IsString()
  modalidad?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Fecha de Visita Domiciliaria debe ser válida.' })
  @IsNotAfterYear(2026, { message: 'Fecha de Visita no puede superar el año 2026.' })
  fecha_visita_domiciliaria?: string;

  @IsOptional()
  @IsString()
  tipo_problematica?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Fecha Reinserción debe ser una fecha válida.' })
  @IsNotAfterYear(2026, { message: 'Fecha Reinserción no puede superar el año 2026.' })
  fecha_reinsercion_derivacion?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
