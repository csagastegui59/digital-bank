import { Body, Controller, Post, Get, UseGuards, Req, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { SignupRateLimiterService } from './signup-rate-limiter.service';
import { SignupDto, LoginDto } from './dto/auth.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private auth: AuthService,
    private signupRateLimiter: SignupRateLimiterService,
  ) {}

  @ApiOperation({ summary: 'Get signup rate limit status' })
  @ApiResponse({ status: 200, description: 'Returns signup availability and remaining time' })
  @Get('signup-status')
  getSignupStatus() {
    return this.signupRateLimiter.getStatus();
  }

  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @ApiResponse({ status: 429, description: 'Too many signup attempts - rate limit exceeded' })
  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    if (!this.signupRateLimiter.canSignup()) {
      const remainingSeconds = this.signupRateLimiter.getRemainingSeconds();
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Por favor espera ${Math.ceil(remainingSeconds / 60)} minutos antes de registrar otro usuario`,
          remainingSeconds,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const result = await this.auth.signup(signupDto);
    this.signupRateLimiter.recordSignup();
    return result;
  }

  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful - returns access and refresh tokens' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.auth.login(loginDto.email, loginDto.password);
  }

  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  refresh(@Req() req: any) {
    return this.auth.refresh(req.user.userId, req.user.refreshToken);
  }

  @ApiOperation({ summary: 'Logout user and invalidate refresh token' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(AuthGuard('jwt'))
  @Post('logout')
  logout(@Req() req: any) {
    return this.auth.logout(req.user.userId);
  }
}
