import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

// Notification locale = une demande de kinésithérapie reçue pour ce service.
// Alimentée par le poller (service prescription) et lisible par le frontend.
@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  // ID de la prescription côté service Prescription (sert de clé de déduplication)
  @Column({ unique: true })
  prescriptionId: string;

  @Column({ nullable: true })
  demandeId: string;

  // Référence patient du service Accueil (ex. CHU-2026-00046) — pas d'identité stockée ici
  @Column({ nullable: true })
  patientId: string;

  @Column({ nullable: true })
  typeKine: string;

  @Column({ nullable: true })
  urgence: string;

  @Column({ nullable: true })
  diagnostic: string;
  @Column({ type: 'text', nullable: true })
  objectifs: string;

  @Column({ type: 'text', nullable: true })
  renseignements: string;

  // CREEE (reçue) | PLANIFIEE (RDV créé)
  @Column({ default: 'CREEE' })
  statut: string;

  @Column({ default: false })
  lue: boolean;

  @Column({ nullable: true })
  source: string;

  @CreateDateColumn()
  createdAt: Date;
}
