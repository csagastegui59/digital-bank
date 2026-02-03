import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity, UserRole } from '../entities/users/user.entity';
import { SignupDto } from '../auth/dto/auth.dto';
import { UserAlreadyExistsException, UserNotFoundException } from '../common/exceptions/business.exception';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepo: Repository<UserEntity>,
  ) {}

  async createUser(signupDto: SignupDto): Promise<UserEntity> {
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
      email: signupDto.email,
      passwordHash,
      role: signupDto.role || UserRole.CUSTOMER,
      isActive: true,
    });

    return await this.usersRepo.save(user);
  }

  async findById(id: string): Promise<UserEntity> {
    const user = await this.usersRepo.findOne({ where: { id } });
    
    if (!user) {
      throw new UserNotFoundException();
    }

    return user;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return await this.usersRepo.findOne({ where: { email } });
  }

  async findAll(): Promise<UserEntity[]> {
    return await this.usersRepo.find({
      select: ['id', 'email', 'role', 'isActive', 'createdAt', 'updatedAt'],
    });
  }

  async updateUser(id: string, updates: Partial<UserEntity>): Promise<UserEntity> {
    const user = await this.findById(id);
    
    Object.assign(user, updates);
    
    return await this.usersRepo.save(user);
  }

  async deactivateUser(id: string): Promise<UserEntity> {
    return await this.updateUser(id, { isActive: false });
  }

  async activateUser(id: string): Promise<UserEntity> {
    return await this.updateUser(id, { isActive: true });
  }
}
