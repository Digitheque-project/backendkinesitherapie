import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Patient } from '../patients/patient.entity';

@Entity()
export class Seance {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  patientId: number;

  @ManyToOne(() => Patient, { eager: true, nullable: false })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column({ nullable: true })
  date: string;

  @Column({ nullable: true })
  heureDebut: string;

  @Column({ nullable: true })
  heureFin: string;

  @Column({ type: 'text', nullable: true })
  traitement: string;

  @Column({ type: 'text', nullable: true })
  evolution: string;

  @Column({ type: 'text', nullable: true })
  conseil: string;

  @Column({ nullable: true })
  kine: string;

  @CreateDateColumn()
  createdAt: Date;
}
