import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRole } from '@spectech/shared-types';
import { Repository } from 'typeorm';
import { UserEntity } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  findByPhone(phone: string): Promise<UserEntity | null> {
    return this.usersRepository.findOneBy({ phone });
  }

  findById(id: string): Promise<UserEntity | null> {
    return this.usersRepository.findOneBy({ id });
  }

  create(data: {
    role: UserRole;
    fullName: string;
    phone: string;
    email?: string;
    passwordHash: string;
  }): Promise<UserEntity> {
    const user = this.usersRepository.create(data);
    return this.usersRepository.save(user);
  }
}
