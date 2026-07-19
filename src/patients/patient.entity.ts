import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Patient {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true, unique: true })
  numeroDossier: string;

  @Column()
  nom: string;

  @Column()
  prenom: string;

  @Column({ nullable: true })
  dateNaissance: string;

  @Column({ nullable: true })
  sexe: string;

  @Column({ nullable: true })
  adresse: string;

  @Column({ nullable: true })
  telephone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  antecedents: string;

  @Column({ nullable: true })
  diagnostic: string;

  @Column({ default: 'actif' })
  statut: string;

  @Column({ nullable: true })
  dateAdmission: string;

  @Column({ nullable: true })
  dateDerniereVisite: string;
}
