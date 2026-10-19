import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

/**
 * Identite et authentification de ce service aupres des autres services du CHU,
 * via la passerelle (GATEWAY_URL) :
 *  - jeton de service court signe avec le JWT_SECRET partage par tous les
 *    services (plus de compte de service ni de mot de passe a configurer) ;
 *  - serviceId / chuId resolus par NOM dans le registre central (/services),
 *    jamais figes en variable d'environnement : un id peut changer cote
 *    registre sans qu'on en soit prevenu, un nom reste stable.
 */
@Injectable()
export class PrescriptionAuthService {
  private readonly logger = new Logger(PrescriptionAuthService.name);
  private identity: { serviceId: string; chuId: string } | null = null;
  private identityResolvedAt = 0;

  constructor(private readonly config: ConfigService) {}

  /** Origine de la passerelle, sans slash final ('' si non configuree). */
  get gatewayUrl(): string {
    return (this.config.get<string>('GATEWAY_URL') ?? '').replace(/\/+$/, '');
  }

  private get serviceName(): string {
    return this.config.get<string>('SERVICE_NAME') || 'Kinésithérapie';
  }

  async getValidToken(): Promise<string | null> {
    const secret = this.config.get<string>('JWT_SECRET');
    if (!secret) {
      this.logger.warn('JWT_SECRET manquant : appels aux autres services sans jeton');
      return null;
    }
    return jwt.sign({ userId: 'service-kine', role: 'SERVICE' }, secret, { expiresIn: '2m' });
  }

  async authHeaders(): Promise<Record<string, string>> {
    const token = await this.getValidToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /** serviceId / chuId de ce service, resolus par nom (rafraichis toutes les 10 min). */
  async getIdentity(): Promise<{ serviceId: string; chuId: string } | null> {
    const fresh = Date.now() - this.identityResolvedAt < 10 * 60 * 1000;
    if (this.identity && fresh) return this.identity;
    if (!this.gatewayUrl) return this.identity;
    try {
      const res = await fetch(`${this.gatewayUrl}/services`, { headers: await this.authHeaders() });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list: any[] = Array.isArray(data) ? data : (data?.services ?? data?.data ?? []);
      const found = list.find((s) => (s?.name ?? '').trim() === this.serviceName);
      if (found?.id && found?.chuId) {
        this.identity = { serviceId: found.id, chuId: found.chuId };
        this.identityResolvedAt = Date.now();
      } else {
        this.logger.warn(`Service "${this.serviceName}" introuvable dans le registre central`);
      }
    } catch (e) {
      this.logger.warn(`Resolution de l'identite echouee (derniere valeur conservee) : ${(e as Error).message}`);
    }
    return this.identity;
  }
}
