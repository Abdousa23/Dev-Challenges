// src/email/email.service.ts
import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { emailConfig } from '../config/email.config';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private transporter: nodemailer.Transporter;

    constructor() {
        // Create transporter with proper typing
        this.transporter = nodemailer.createTransport(emailConfig); // Type assertion to fix TS error

        this.verifyConnection();
    }

    private async verifyConnection() {
        try {
            console.log('Verifying SMTP connection...');
            await this.transporter.verify();
            this.logger.log('SMTP connection verified');
        } catch (error) {
            this.logger.error('Error verifying SMTP connection', error);
        }
    }

    async sendEmail(to: string, subject: string, text: string): Promise<void> {
        try {
            const info = await this.transporter.sendMail({
                from: `"Eid Greetings" <${emailConfig.auth.user}>`,
                to,
                subject,
                text,
            });
            this.logger.log(`Message sent: ${info.messageId}`);
        } catch (error) {
            this.logger.error('Error sending email', error);
            throw error;
        }
    }
}