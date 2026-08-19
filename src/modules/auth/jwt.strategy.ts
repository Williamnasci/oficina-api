import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

// Formato de request.user depois do JwtAuthGuard - reaproveitado onde a
// aplicacao precisa checar propriedade (ex.: cliente so pode consultar a
// propria OS), nao so o papel.
export type AuthenticatedUser = {
  userId: number | string;
  role?: string;
  document?: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  // JWT_SECRET agora e compartilhado com oficina-lambda-auth (ver README):
  // o payload pode vir do login admin/admin deste servico ({sub: number, role})
  // ou do login por CPF emitido pela Lambda ({sub: string (uuid), document}).
  validate(payload: {
    sub: number | string;
    role?: string;
    document?: string;
  }): AuthenticatedUser {
    return {
      userId: payload.sub,
      role: payload.role,
      document: payload.document,
    };
  }
}
