import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '../entities/users/user.entity';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async getMyProfile(@Req() req: any) {
    const user = await this.usersService.findById(req.user.userId);
    const { passwordHash, refreshTokenHash, ...userWithoutSensitive } = user;
    return userWithoutSensitive;
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.OPS)
  async getAllUsers() {
    return await this.usersService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.OPS)
  async getUserById(@Param('id') id: string) {
    const user = await this.usersService.findById(id);
    const { passwordHash, refreshTokenHash, ...userWithoutSensitive } = user;
    return userWithoutSensitive;
  }
}
