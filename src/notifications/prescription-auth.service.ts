import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface CachedToken {
  token: string;
  expiresAt: number;
}

@Injectable()
export class PrescriptionAuthService {
  private readonly logger = new Logger(PrescriptionAuthService.name);
  private cached: CachedToken | null = null;

  constructor(private readonly config: ConfigService) {}

  async getValidToken(): Promise<string | null> {
    const now = Date.now();
    const marge = 5 * 60 * 1000; // renouvelle 5 min avant expiration reelle
    if (this.cached && this.cached.expiresAt - marge > now) {
      return this.cached.token;
    }
    return this.login();
  }

  private async login(): Promise<string | null> {
    const authUrl = this.config.get<string>('AUTH_API_URL');
    const email = this.config.get<string>('KINE_SERVICE_EMAIL');
    const password = this.config.get<string>('KINE_SERVICE_PASSWORD');

    if (!authUrl || !email || !password) {
      this.logger.warn(
        'AUTH_API_URL / KINE_SERVICE_EMAIL / KINE_SERVICE_PASSWORD manquants - impossible de generer un nouveau token',
      );
      return null;
    }

    try {
      // TODO: confirmer le endpoint exact aupres du chef d'equipe (ex: /auth/login)
      const res = await fetch(`${authUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        this.logger.error(`Echec de connexion au service d'authentification : ${res.status}`);
        return null;
      }

      const data = await res.json();
      // TODO: adapter le nom du champ selon la vraie reponse (accessToken, token, jwt...)
      const token: string = data.accessToken || data.token;
      if (!token) {
        this.logger.error("Le service d'authentification n'a pas renvoye de token");
        return null;
      }

      const exp = this.decoderExpiration(token);
      this.cached = {
        token,
        expiresAt: exp ? exp * 1000 : Date.now() + 24 * 60 * 60 * 1000,
      };
      this.logger.log('Nouveau token PRESCRIPTION genere automatiquement');
      return token;
    } catch (e) {
      this.logger.error('Erreur lors de la generation automatique du token', e as Error);
      return null;
    }
  }

  private decoderExpiration(token: string): number | null {
    try {
      const payload = token.split('.')[1];
      const decoded = Buffer.from(payload, 'base64').toString('utf8');
      const data = JSON.parse(decoded);
      return data.exp ?? null;
    } catch {
      return null;
    }
  }
}
