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
    roles: UserRole[];
    fullName: string;
    phone: string;
    email?: string;
    passwordHash: string;
  }): Promise<UserEntity> {
    const user = this.usersRepository.create(data);
    return this.usersRepository.save(user);
  }

  findManyById(ids: string[]): Promise<UserEntity[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return this.usersRepository.createQueryBuilder('u').whereInIds(ids).getMany();
  }

  findOperators(): Promise<UserEntity[]> {
    return this.usersRepository
      .createQueryBuilder('u')
      .where(':role = ANY(u.roles)', { role: UserRole.OPERATOR })
      .getMany();
  }
}
