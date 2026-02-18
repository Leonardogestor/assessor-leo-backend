import { UserRepository } from '../repositories/UserRepository';
import { CreateUserDTO, UpdateUserDTO, UserResponse } from '../types/user.types';
import { AppError } from '../utils/AppError';
import { hashPassword } from '../utils/auth';

const userRepository = new UserRepository();

export class UserService {
  async create(data: CreateUserDTO): Promise<UserResponse> {
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new AppError('Email already in use', 409);
    }

    const hashedPassword = await hashPassword(data.password);
    const user = await userRepository.create({
      ...data,
      password: hashedPassword,
    });

    return this.sanitizeUser(user);
  }

  async findAll(): Promise<UserResponse[]> {
    const users = await userRepository.findAll();
    return users.map(this.sanitizeUser);
  }

  async findById(id: string): Promise<UserResponse> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return this.sanitizeUser(user);
  }

  async update(id: string, data: UpdateUserDTO): Promise<UserResponse> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (data.email && data.email !== user.email) {
      const existingUser = await userRepository.findByEmail(data.email);
      if (existingUser) {
        throw new AppError('Email already in use', 409);
      }
    }

    if (data.password) {
      data.password = await hashPassword(data.password);
    }

    const updatedUser = await userRepository.update(id, data);
    return this.sanitizeUser(updatedUser);
  }

  async delete(id: string): Promise<void> {
    const user = await userRepository.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    await userRepository.delete(id);
  }

  private sanitizeUser(user: any): UserResponse {
    const { password, ...sanitized } = user;
    return sanitized;
  }
}
