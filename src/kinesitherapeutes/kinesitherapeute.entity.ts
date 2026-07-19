import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class Kinesitherapeute {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nom: string;

  @Column()
  prenom: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  telephone: string;

  @Column({ nullable: true })
  specialite: string;

  @Column({ default: true })
  actif: boolean;
}
