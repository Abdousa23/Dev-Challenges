import { Module } from '@nestjs/common';
import { CaptchaService } from './captcha.service';
import { CaptchaController } from './captcha.controller';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';
@Module({
  imports: [CacheModule.register({
    store: redisStore,
    host: 'localhost',
    port: 6379,
    ttl: 300,
  }),],
  controllers: [CaptchaController],
  providers: [CaptchaService],
})
export class CaptchaModule { }
