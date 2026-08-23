import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { PatientsService } from '../patients/patients.service';
import { SeancesService } from '../seances/seances.service';

@Controller('services/patients')
export class ServicesExternesController {
  constructor(
    private readonly patientsService: PatientsService,
    private readonly seancesService: SeancesService,
  ) {}

  @Get(':numeroDossier/compte-rendu')
  async compteRendu(@Param('numeroDossier') numeroDossier: string) {
    const patient = await this.patientsService.findByNumeroDossier(numeroDossier);
    if (!patient) {
      throw new NotFoundException('Patient introuvable pour ce numeroDossier');
    }

    const seancesValidees = await this.seancesService.findByPatientValidees(patient.id);

    return {
      patientId: numeroDossier,
      nom: patient.nom,
      prenom: patient.prenom,
      objectifPrescripteur: patient.objectifs,
      diagnostic: patient.diagnostic,
      alertes: patient.alertes,
      seances: seancesValidees.map((s) => ({
        date: s.date,
        diagnosticKine: s.diagnosticKine,
        bilan: s.bilan,
        traitement: s.traitement,
        evolution: s.evolution,
        conseil: s.conseil,
        kine: s.kine,
      })),
    };
  }
}
