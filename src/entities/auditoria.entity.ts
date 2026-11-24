import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('auditoria')
export class Auditoria {

  @PrimaryGeneratedColumn()
  id!:number;

  @Column()
  accion!:string;

  @Column()
  usuario!:string;

  @CreateDateColumn()
  fecha!:Date;

  @Column({ type: 'jsonb', nullable: true })
  detalles?: any;
}