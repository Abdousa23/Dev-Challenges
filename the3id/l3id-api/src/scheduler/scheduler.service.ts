import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { GreetingsService } from '../greetings/greetings.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    private readonly greetingsService: GreetingsService,
    private readonly emailService: EmailService,
  ) { }

  @Cron(CronExpression.EVERY_MINUTE) // In production, use EVERY_HOUR or specific time
  async handleCron() {
    this.logger.debug('Checking for pending greetings...');
    const pendingGreetings = await this.greetingsService.findPending();
    const now = new Date();

    for (const greeting of pendingGreetings) {
      if (greeting.scheduledTime <= now) {
        this.logger.log(`Sending greeting ID: ${greeting.id}`);

        try {
          await this.emailService.sendEmail(
            greeting.recipientEmail,
            `Eid Greetings from ${greeting.senderName}`,
            greeting.message
          );
          await this.greetingsService.markAsSent(greeting.id);
        } catch (error) {
          this.logger.error(`Failed to send greeting ID: ${greeting.id}`, error);
        }
      }
    }
  }
}