import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Greeting } from '../greetings/entities/greeting.entity';
import { SchedulerService } from './scheduler.service';
import { GreetingsService } from '../greetings/greetings.service';
import { EmailService } from 'src/email/email.service';
import { GreetingsModule } from 'src/greetings/greetings.module';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [TypeOrmModule.forFeature([Greeting]), GreetingsModule, EmailModule],
  providers: [SchedulerService, GreetingsService, EmailService],
})
export class SchedulerModule { }