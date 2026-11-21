import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class ServiceAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    // Page de santé (« Hello World ») : seule route publique, sans donnée.
    const chemin = String(request.path ?? request.url ?? '').replace(/\/+$/, '');
    if (request.method === 'GET' && chemin === '/kine/api') return true;
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token manquant');
    }

    const token = authHeader.substring('Bearer '.length);
    const secret = this.config.get<string>('JWT_SECRET');

    if (!secret) {
      throw new UnauthorizedException(
        "Configuration serveur incomplete (JWT_SECRET manquant)",
      );
    }

    // Jeton de service partagé (appels serveur à serveur), comme la passerelle.
    const jetonService = this.config.get<string>('SERVICE_API_TOKEN');
    if (jetonService && token.trim() === jetonService.trim()) return true;

    try {
      const payload = jwt.verify(token, secret);
      request.servicePayload = payload;
      return true;
    } catch (e) {
      throw new UnauthorizedException('Token invalide ou expire');
    }
  }
}
