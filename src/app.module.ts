import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { PersonasModule } from './personas/personas.module';
import { AuditoriaModule } from './auditoria/auditoria.module';
import { Persona } from './entities/persona.entity';
import { Pais } from './entities/pais.entity';
import { Usuario } from './entities/usuario.entity';
import { Auditoria } from './entities/auditoria.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: '12345',
      database: 'personas_db',
      entities: [Persona, Pais, Usuario, Auditoria],
      autoLoadEntities: true,
      synchronize: true,
    }),

    AuthModule,
    UsuariosModule,
    PersonasModule,
    AuditoriaModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
