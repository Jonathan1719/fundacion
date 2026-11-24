import {
  Entity,
  PrimaryGeneratedColumn,
  Column
} from 'typeorm';


@Entity('personas')
export class Persona {

  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  numero?: number;

  @Column({ nullable: true })
  nombres?: string;

  @Column({ nullable: true })
  apellidos?: string;

  @Column({ nullable: true })
  codigo?: string;

  @Column({ nullable: true })
  sexo?: string;

  @Column({ nullable: true })
  fecha_ingreso?: Date;

  @Column({ nullable: true })
  edad_al_ingresar?: number;

  @Column({ nullable: true })
  cedula?: string;

  @Column({ nullable: true })
  fecha_nac?: Date;

  @Column({ nullable: true })
  edad_actual_anios?: number;

  @Column({ nullable: true })
  edad_actual_meses?: number;

  @Column({ nullable: true })
  edad_actual_dias?: number;

  @Column({ nullable: true })
  ciudad_origen?: string;

  @Column({ nullable: true })
  direccion?: string;

  @Column({ nullable: true })
  telefono_contacto?: string;

  @Column({ nullable: true })
  representante?: string;

  @Column({ nullable: true})
  derivado_por?: string;

  @Column({ nullable: true })
  modalidad?: string;

  @Column({ nullable: true })
  fecha_visita_domiciliaria?: Date;

  @Column({ nullable: true })
  tipo_problematica?: string;

  @Column({ nullable: true })
  fecha_reinsercion_derivacion?: Date;

  @Column({ type: 'text', nullable: true })
  observaciones?: string;

  @Column({ name: 'codigo_pais', default: '+593' })
  codigo_pais!: string;

}