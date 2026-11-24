import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('paises')
export class Pais {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, nullable: true })
  nombre?: string;

  @Column({ unique: true, nullable: true })
  codigo?: string;

  @Column({ unique: true, nullable: true })
  prefijo?: string;
}
