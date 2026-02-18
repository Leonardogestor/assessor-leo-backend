import { Request, Response } from 'express';
import { UserService } from '../services/UserService';

const userService = new UserService();

export class UserController {
  async create(req: Request, res: Response): Promise<void> {
    const user = await userService.create(req.body);
    res.status(201).json(user);
  }

  async findAll(req: Request, res: Response): Promise<void> {
    const users = await userService.findAll();
    res.json(users);
  }

  async findById(req: Request, res: Response): Promise<void> {
    const user = await userService.findById(req.params.id);
    res.json(user);
  }

  async update(req: Request, res: Response): Promise<void> {
    const user = await userService.update(req.params.id, req.body);
    res.json(user);
  }

  async delete(req: Request, res: Response): Promise<void> {
    await userService.delete(req.params.id);
    res.status(204).send();
  }
}
