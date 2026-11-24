import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Persona } from '../entities/persona.entity';
import { Pais } from '../entities/pais.entity';

@Injectable()
export class PersonasService implements OnModuleInit {
  constructor(
    @InjectRepository(Persona)
    private personasRepository: Repository<Persona>,

    @InjectRepository(Pais)
    private paisRepository: Repository<Pais>,
  ) {}

  async onModuleInit() {
    try {
      // SÓLO SEMBRAMOS LOS PAÍSES: Esto es indispensable para que funcione el catálogo
      const count = await this.paisRepository.count();
      if (count === 0) {
        const initialCountries = [
          { nombre: 'Ecuador', codigo: 'EC', prefijo: '+593' },
          { nombre: 'Colombia', codigo: 'CO', prefijo: '+57' },
          { nombre: 'Perú', codigo: 'PE', prefijo: '+51' },
          { nombre: 'Venezuela', codigo: 'VE', prefijo: '+58' },
          { nombre: 'España', codigo: 'ES', prefijo: '+34' },
          { nombre: 'Estados Unidos', codigo: 'US', prefijo: '+1' },
          { nombre: 'Argentina', codigo: 'AR', prefijo: '+54' },
          { nombre: 'México', codigo: 'MX', prefijo: '+52' },
        ];
        await this.paisRepository.save(initialCountries);
        console.log('Catálogo de países sembrado correctamente.');
      }
    } catch (e) {
      console.warn('Advertencia al sembrar catálogo de base de datos:', (e as any).message);
    }
  }

  async create(createPersonaDto: Partial<Persona>): Promise<Persona> {
    // Calcular próximo número automáticamente
    const maxNumero = await this.personasRepository
      .createQueryBuilder('p')
      .select('MAX(p.numero)', 'max')
      .getRawOne();
    const siguienteNumero = (maxNumero?.max ?? 0) + 1;

    // Generar código automático tipo "001", "002", etc.
    // ⚠️ OJO: esto SOBRESCRIBE cualquier "codigo" que venga en createPersonaDto
    // (por ejemplo, si tu CreateBeneficiarioDto también trae un campo "codigo" del formulario)
    const codigoAuto = siguienteNumero.toString().padStart(3, '0');

    const persona = this.personasRepository.create({
      ...createPersonaDto,
      numero: siguienteNumero,
      codigo: codigoAuto,
    });
    return this.personasRepository.save(persona);
  }

  async findAll(): Promise<Persona[]> {
    return this.personasRepository.find({
      order: {
        id: 'DESC', // Muestra los últimos importados arriba
      },
    });
  }

  async findOne(id: number): Promise<Persona | null> {
    return this.personasRepository.findOne({
      where: { id },
    });
  }

  async update(id: number, updatePersonaDto: Partial<Persona>): Promise<Persona | null> {
    await this.personasRepository.update(id, updatePersonaDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<boolean> {
    const result = await this.personasRepository.delete(id);
    return result.affected !== 0;
  }

  async createMany(personas: Partial<Persona>[]): Promise<Persona[]> {
    const personasEntities = this.personasRepository.create(personas);
    return this.personasRepository.save(personasEntities);
  }

  async removeAll(): Promise<void> {
    await this.personasRepository.clear();
  }

  async listarPaises(): Promise<Pais[]> {
    return this.paisRepository.find({ order: { nombre: 'ASC' } });
  }
}