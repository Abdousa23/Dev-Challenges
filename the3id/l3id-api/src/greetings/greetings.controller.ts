import { Controller, Get, Post, Body } from '@nestjs/common';
import { GreetingsService } from './greetings.service';
import { CreateGreetingDto } from './dto/create-greeting.dto';
import { Greeting } from './entities/greeting.entity';

@Controller('greetings')
export class GreetingsController {
  constructor(private readonly greetingsService: GreetingsService) { }

  @Post()
  create(@Body() createGreetingDto: CreateGreetingDto): Promise<Greeting> {
    return this.greetingsService.create(createGreetingDto);
  }

  @Get()
  findAll(): Promise<Greeting[]> {
    return this.greetingsService.findAll();
  }
}