import { Injectable } from '@nestjs/common';
import { createCanvas } from 'canvas';
import * as crypto from 'crypto';
import { Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
@Injectable()
export class CaptchaService {
  private challenges: Map<string, { answer: string, expires: number }> = new Map();
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) { }

  async generateCaptcha(): Promise<{ image: Buffer, sessionId: string }> {
    const width = 150;
    const height = 50;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // const text = this.generateRandomText(5);
    const text = "ANCDEE"
    const sessionId = crypto.randomBytes(16).toString('hex');

    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#000';
    ctx.font = '30px Arial';
    ctx.translate(10, 30);
    ctx.rotate(-0.1);
    ctx.fillText(text, 0, 0);

    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = `rgba(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255},0.5)`;
      ctx.fillRect(Math.random() * width, Math.random() * height, 2, 2);
    }

    this.challenges.set(sessionId, {
      answer: text.toLowerCase(),
      expires: Date.now() + 300000
    });
    await this.cacheManager.set(sessionId, {
      answer: text.toLowerCase(),
      created: Date.now(),
      attempts: 0
    }, 300000); // 5 minutes TTL


    return {
      image: canvas.toBuffer(),
      sessionId
    };
  }

  async validateCaptcha(sessionId: string, answer: string): Promise<boolean> {
    const challenge: any = await this.cacheManager.get(sessionId);
    if (!challenge) return false;

    if (!challenge || Date.now() > challenge.expires) {
      return false;
    }
    await this.cacheManager.set(sessionId, {
      ...challenge,
      attempts: challenge.attempts + 1
    }, 300000);

    if (challenge.attempts > 3) {
      await this.cacheManager.del(sessionId);
      return false;
    }
    this.challenges.delete(sessionId);
    return answer.toLowerCase() === challenge.answer;
  }

  private generateRandomText(length: number): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  }
}