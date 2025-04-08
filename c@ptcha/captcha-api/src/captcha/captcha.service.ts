import { Injectable, Inject, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { createCanvas, registerFont, CanvasRenderingContext2D } from 'canvas';
import * as crypto from 'crypto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

interface CaptchaData {
  answer: string;
  created: number;
  attempts: number;
  ipAddress?: string;
}

@Injectable()
export class CaptchaService {
  private readonly CAPTCHA_TTL = 300000;
  private readonly MAX_ATTEMPTS = 3;
  private readonly GENERATION_COOLDOWN = 5000;

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) { }

  async generateCaptcha(ipAddress?: string): Promise<{ image: Buffer; sessionId: string }> {
    if (ipAddress) {
      const lastGenerationKey = `captcha_gen_${ipAddress}`;
      const lastGeneration = await this.cacheManager.get<number>(lastGenerationKey);

      if (lastGeneration && Date.now() - lastGeneration < this.GENERATION_COOLDOWN) {
        throw new HttpException('Too many CAPTCHA requests. Please wait a moment.', HttpStatus.TOO_MANY_REQUESTS);
      }

      await this.cacheManager.set(lastGenerationKey, Date.now(), this.GENERATION_COOLDOWN);
    }

    const width = 200;
    const height = 70;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    const textLength = Math.floor(Math.random() * 3) + 6;
    const text = this.generateRandomText(textLength);
    const sessionId = crypto.randomBytes(20).toString('hex');
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, width, height);
    this.addNoiseGrid(ctx, width, height);
    this.addDistortionLines(ctx, width, height);
    this.drawDistortedText(ctx, text, width, height);
    this.addNoiseDots(ctx, width, height);

    const captchaData: CaptchaData = {
      answer: text.toLowerCase(),
      created: Date.now(),
      attempts: 0,
      ipAddress
    };

    await this.cacheManager.set(sessionId, captchaData, this.CAPTCHA_TTL);

    return {
      image: canvas.toBuffer(),
      sessionId
    };
  }

  async validateCaptcha(sessionId: string, answer: string): Promise<boolean> {
    if (!sessionId || !answer) {
      return false;
    }

    const challenge = await this.cacheManager.get<CaptchaData>(sessionId);
    if (!challenge) {
      return false;
    }

    if (Date.now() - challenge.created > this.CAPTCHA_TTL) {
      await this.cacheManager.del(sessionId);
      return false;
    }

    challenge.attempts += 1;

    if (challenge.attempts > this.MAX_ATTEMPTS) {
      await this.cacheManager.del(sessionId);
      throw new BadRequestException('Maximum validation attempts exceeded');
    }

    await this.cacheManager.set(sessionId, challenge, this.CAPTCHA_TTL - (Date.now() - challenge.created));

    const isValid = answer.toLowerCase().trim() === challenge.answer;

    if (isValid) {
      await this.cacheManager.del(sessionId);
    }

    return isValid;
  }

  private generateRandomText(length: number): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    return Array.from({ length }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  }

  private drawDistortedText(ctx: any, text: string, width: number, height: number): void {
    ctx.fillStyle = '#000000';

    const fonts = ['Arial', 'Georgia', 'Courier', 'Verdana', 'Times New Roman'];
    const fontSize = Math.floor(height * 0.5); // Base font size

    let x = 15;

    for (let i = 0; i < text.length; i++) {
      const font = fonts[Math.floor(Math.random() * fonts.length)];

      const charFontSize = fontSize + Math.floor(Math.random() * 10) - 5;
      ctx.font = `bold ${charFontSize}px ${font}`;

      ctx.save();

      ctx.translate(x, height / 2 + Math.random() * 10 - 5);

      const rotation = (Math.random() - 0.5) * 0.4;
      ctx.rotate(rotation);

      ctx.fillText(text[i], 0, 0);

      ctx.restore();

      x += ctx.measureText(text[i]).width + 2 + Math.random() * 5;
    }
  }

  private addDistortionLines(ctx: any, width: number, height: number): void {
    const lineCount = 2 + Math.floor(Math.random() * 3);

    for (let i = 0; i < lineCount; i++) {
      ctx.beginPath();
      ctx.lineWidth = 1 + Math.random() * 2;

      const r = Math.floor(Math.random() * 150);
      const g = Math.floor(Math.random() * 150);
      const b = Math.floor(Math.random() * 150);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.7)`;

      ctx.moveTo(0, Math.random() * height);

      const cp1x = width / 3;
      const cp1y = Math.random() * height;
      const cp2x = (width / 3) * 2;
      const cp2y = Math.random() * height;

      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, width, Math.random() * height);
      ctx.stroke();
    }
  }

  private addNoiseGrid(ctx: any, width: number, height: number): void {
    const gridSize = 10;

    for (let x = 0; x < width; x += gridSize) {
      for (let y = 0; y < height; y += gridSize) {
        const value = Math.floor(Math.random() * 30);
        ctx.fillStyle = `rgba(${200 + value}, ${200 + value}, ${200 + value}, 0.5)`;
        ctx.fillRect(x, y, gridSize, gridSize);
      }
    }
  }

  private addNoiseDots(ctx: any, width: number, height: number): void {
    const dotCount = 100 + Math.floor(Math.random() * 100);

    for (let i = 0; i < dotCount; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      const size = Math.random() * 3;

      const r = Math.floor(Math.random() * 255);
      const g = Math.floor(Math.random() * 255);
      const b = Math.floor(Math.random() * 255);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.5)`;

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

}