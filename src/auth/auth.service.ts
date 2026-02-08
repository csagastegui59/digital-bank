import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/users/user.entity';
import { JwtPayload } from './types';
import { SignupDto } from './dto/auth.dto';
import { InvalidCredentialsException, UserAlreadyExistsException } from '../common/exceptions/business.exception';
import { AccountsService } from '../accounts/accounts.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity) private usersRepo: Repository<UserEntity>,
    private jwt: JwtService,
    private accountsService: AccountsService,
  ) {}

  async signup(signupDto: SignupDto) {
    // Check if user already exists
    const existingUser = await this.usersRepo.findOne({
      where: { email: signupDto.email },
    });

    if (existingUser) {
      throw new UserAlreadyExistsException();
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(signupDto.password, saltRounds);

    // Create user
    const user = this.usersRepo.create({
      firstname: signupDto.firstname,
      lastname: signupDto.lastname,
      email: signupDto.email,
      passwordHash,
      role: signupDto.role,
      isActive: true,
    });

    const savedUser = await this.usersRepo.save(user);

    // Create initial account with 1000 USD
    await this.accountsService.createInitialAccount(savedUser.id);

    // Generate tokens
    const tokens = await this.issueTokens(savedUser);
    await this.saveRefreshTokenHash(savedUser.id, tokens.refreshToken);

    return {
      user: { 
        id: savedUser.id, 
        email: savedUser.email, 
        role: savedUser.role,
        firstname: savedUser.firstname,
        lastname: savedUser.lastname,
      },
      ...tokens,
    };
  }

  async login(email: string, password: string) {
    const user = await this.usersRepo.findOne({ where: { email } });
    if (!user || !user.isActive) throw new InvalidCredentialsException();

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new InvalidCredentialsException();

    const tokens = await this.issueTokens(user);
    await this.saveRefreshTokenHash(user.id, tokens.refreshToken);

    return { 
      user: { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        firstname: user.firstname,
        lastname: user.lastname,
      }, 
      ...tokens 
    };
  }

  async refresh(userId: string, refreshToken: string) {
    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user || !user.refreshTokenHash) throw new InvalidCredentialsException();

    const ok = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!ok) throw new InvalidCredentialsException();

    const tokens = await this.issueTokens(user);
    await this.saveRefreshTokenHash(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string) {
    await this.usersRepo.update({ id: userId }, { refreshTokenHash: null });
    return { ok: true };
  }

  private async issueTokens(user: UserEntity) {
    const payload: JwtPayload = { sub: user.id, role: user.role, email: user.email };

    const accessTtl = Number(process.env.JWT_ACCESS_TTL ?? 900);
    const refreshTtl = Number(process.env.JWT_REFRESH_TTL ?? 1209600);

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload, {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: accessTtl,
      }),
      this.jwt.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: refreshTtl,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async saveRefreshTokenHash(userId: string, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    await this.usersRepo.update({ id: userId }, { refreshTokenHash: hash });
  }
}
