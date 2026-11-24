import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Auditoria } from '../entities/auditoria.entity';

@Injectable()
export class AuditoriaService {
  constructor(
    @InjectRepository(Auditoria)
    private readonly auditoriaRepository: Repository<Auditoria>,
  ) {}

  async registrar(usuario: string, accion: string, detalles: any): Promise<Auditoria> {
    const log = this.auditoriaRepository.create({
      usuario,
      accion,
      detalles,
    });
    return this.auditoriaRepository.save(log);
  }

  async listar(): Promise<Auditoria[]> {
    return this.auditoriaRepository.find({
      order: {
        fecha: 'DESC',
      },
    });
  }
}
