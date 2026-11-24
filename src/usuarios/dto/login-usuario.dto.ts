import { IsNotEmpty, IsString } from 'class-validator';

export class LoginUsuarioDto {
  @IsNotEmpty({ message: 'El usuario, correo electrónico o cédula es obligatorio.' })
  @IsString({ message: 'El usuario debe ser un texto válido.' })
  usuario!: string;

  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  @IsString({ message: 'La contraseña debe ser un texto válido.' })
  password!: string;
}
