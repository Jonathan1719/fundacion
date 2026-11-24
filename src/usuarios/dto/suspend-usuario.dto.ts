import { IsIn, IsNotEmpty } from 'class-validator';

export class SuspendUsuarioDto {
  @IsNotEmpty({ message: 'La duración de la suspensión es obligatoria.' })
  @IsIn(['1d', '3d', '7d', '15d', '30d', 'permanente'], {
    message: 'Duración no válida. Use: 1d, 3d, 7d, 15d, 30d o permanente.',
  })
  duracion!: string;
}
