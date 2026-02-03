import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPayload } from './types';

@Injectable()
export class RefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_REFRESH_SECRET || '',
      passReqToCallback: true,
    });
  }

  validate(req: any, payload: JwtPayload) {
    const auth = req.get('authorization') || '';
    const refreshToken = auth.replace('Bearer ', '').trim();
    return { userId: payload.sub, role: payload.role, email: payload.email, refreshToken };
  }
}
