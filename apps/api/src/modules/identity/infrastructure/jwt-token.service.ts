import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { TOKEN_SERVICE, type TokenPayload, type TokenService } from '../domain/ports/token.service';

/**
 * Implementación JWT del puerto `TokenService`.
 * El `JwtService` proviene de `JwtModule.registerAsync` (global) en `IdentityModule`.
 */
@Injectable()
export class JwtTokenService implements TokenService {
  constructor(private readonly jwt: JwtService) {}

  sign(payload: TokenPayload): Promise<string> {
    return this.jwt.signAsync(payload);
  }

  verify(token: string): TokenPayload {
    return this.jwt.verify<TokenPayload>(token);
  }
}
