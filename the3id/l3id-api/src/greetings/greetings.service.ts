import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Greeting } from './entities/greeting.entity';
import { CreateGreetingDto } from './dto/create-greeting.dto';

@Injectable()
export class GreetingsService {
  constructor(
    @InjectRepository(Greeting)
    private greetingRepository: Repository<Greeting>,
  ) { }

  async create(createGreetingDto: CreateGreetingDto): Promise<Greeting> {
    const greeting = this.greetingRepository.create(createGreetingDto);
    return this.greetingRepository.save(greeting);
  }

  async findAll(): Promise<Greeting[]> {
    return this.greetingRepository.find();
  }

  async findPending(): Promise<Greeting[]> {
    return this.greetingRepository.find({ where: { isSent: false } });
  }

  async markAsSent(id: number): Promise<void> {
    await this.greetingRepository.update(id, { isSent: true });
  }
}