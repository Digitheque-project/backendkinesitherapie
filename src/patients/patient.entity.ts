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
  @Column({ nullable: true })
  urgence: string;
  @Column({ type: 'text', nullable: true })
  alertes: string;
  @Column({ type: 'text', nullable: true })
  objectifs: string;
  @Column({ type: 'text', nullable: true })
  remarques: string;
  @Column({ nullable: true })
  nomMedecinPrescripteur: string;

  // Bilan kinésithérapique du patient (établi puis complété au fil des
  // séances). Gardé avant dans le seul navigateur du soignant : perdu d'un
  // poste à l'autre. Colonnes ajoutées, nullables : sans risque pour synchronize.
  @Column({ nullable: true })
  religion: string;

  @Column({ type: 'text', nullable: true })
  histoireMaladie: string;

  @Column({ type: 'text', nullable: true })
  bilanFonctionnel: string;

  @Column({ type: 'text', nullable: true })
  bilanIncapacite: string;

  @Column({ type: 'text', nullable: true })
  diagnosticKine: string;
}
