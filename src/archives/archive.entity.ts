import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Patient } from '../patients/patient.entity';

@Entity()
export class Archive {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'date', nullable: true })
  dateArchivage: string;

  @Column({ nullable: true })
  motif: string;

  @Column({ type: 'text', nullable: true })
  resumeMedical: string;

  @Column({ type: 'text', nullable: true })
  exercicesRealises: string;

  @Column({ type: 'int', default: 0, nullable: true })
  progressionFinale: number;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @ManyToOne(() => Patient, { eager: true, nullable: true })
  @JoinColumn({ name: 'patientId' })
  patient: Patient;

  @Column({ nullable: true })
  patientId: number;
}
