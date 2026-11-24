import { IsEmail, IsIn, IsNotEmpty, Matches, MinLength } from 'class-validator';

export class CreateUsuarioDto {
  @IsNotEmpty({ message: 'El nombre completo es obligatorio.' })
  @MinLength(3, { message: 'El nombre completo debe tener al menos 3 caracteres.' })
  @Matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, {
    message: 'El nombre completo solo debe contener letras.',
  })
  nombreCompleto!: string;

  @IsNotEmpty({ message: 'El correo electrónico es obligatorio.' })
  @IsEmail({}, { message: 'El correo electrónico debe tener un formato válido.' })
  email!: string;

  @IsNotEmpty({ message: 'La contraseña es obligatoria.' })
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres.' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=!._\-*?])[A-Za-z\d@#$%^&+=!._\-*?]{8,}$/, {
    message: 'La contraseña debe incluir al menos una mayúscula, una minúscula, un número y un carácter especial (@, #, $, %, etc.).',
  })
  password!: string;

  @IsNotEmpty({ message: 'El rol es obligatorio.' })
  @IsIn(['ADMIN', 'USER', 'MASTER'], { message: 'El rol debe ser ADMIN, USER o MASTER.' })
  rol!: string;
}
