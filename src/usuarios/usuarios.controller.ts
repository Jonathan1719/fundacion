import { Body, Controller, Get, Headers, Param, Patch, Post } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { LoginUsuarioDto } from './dto/login-usuario.dto';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Get()
  async findAll() {
    return this.usuariosService.listar();
  }

  @Post()
  async create(@Body() createUsuarioDto: CreateUsuarioDto) {
    return this.usuariosService.guardar(createUsuarioDto);
  }

  @Post('login')
  async login(@Body() loginUsuarioDto: LoginUsuarioDto) {
    return this.usuariosService.login(loginUsuarioDto.usuario, loginUsuarioDto.password);
  }

  @Patch(':id/suspender')
  async suspender(
    @Param('id') id: string,
    @Body() suspendDto: any,
    @Headers('x-user-role') rolSolicitante: string,
  ) {
    return this.usuariosService.suspender(id, suspendDto, rolSolicitante || 'USER');
  }

  @Patch(':id/reactivar')
  async reactivar(
    @Param('id') id: string,
    @Headers('x-user-role') rolSolicitante: string,
  ) {
    return this.usuariosService.reactivar(id, rolSolicitante || 'USER');
  }
}
