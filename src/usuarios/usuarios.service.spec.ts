import { ConflictException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { QueryFailedError } from 'typeorm';
import { UsuariosService } from './usuarios.service';
import { Usuario } from '../entities/usuario.entity';

describe('UsuariosService', () => {
  let service: UsuariosService;

  const usuarioRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsuariosService,
        {
          provide: getRepositoryToken(Usuario),
          useValue: usuarioRepository,
        },
      ],
    }).compile();

    service = module.get<UsuariosService>(UsuariosService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should throw ConflictException when cedula already exists', async () => {
    usuarioRepository.save.mockRejectedValue(new QueryFailedError('insert', [], { code: '23505' } as never));

    await expect(service.guardar({ cedula: '999' })).rejects.toThrow(ConflictException);
  });
});
