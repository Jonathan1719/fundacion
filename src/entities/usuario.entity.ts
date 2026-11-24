import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';

@Entity('usuarios')
export class Usuario {

  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  cedula?: string;

  @Column({ name: 'nombre_completo', nullable: true })
  nombreCompleto?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true})
  usuario?: string;

  @Column({ nullable: true })
  password?: string;

  @Column({ nullable: true })
  rol?: string;

  @Column({ default: 'Activo' })
  estado!: string;

  @Column({ name: 'fecha_inicio_suspension', type: 'timestamp', nullable: true })
  fechaInicioSuspension?: Date | null;

  @Column({ name: 'fecha_fin_suspension', type: 'timestamp', nullable: true })
  fechaFinSuspension?: Date | null;
}
