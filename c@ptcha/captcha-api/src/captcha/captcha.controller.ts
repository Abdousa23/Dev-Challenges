import { Controller, Post, Body, Get, Res } from '@nestjs/common';
import { CaptchaService } from './captcha.service';

@Controller('captcha')
export class CaptchaController {
  constructor(private readonly captchaService: CaptchaService) { }

  @Get('generate')
  async generate(@Res() res) {
    const { image, sessionId } = await this.captchaService.generateCaptcha();
    res.set('Content-Type', 'image/png');
    res.set('X-Session-Id', sessionId);
    res.send(image);
  }

  @Post('validate')
  validate(@Body() body: { sessionId: string; answer: string }) {
    const valid = this.captchaService.validateCaptcha(body.sessionId, body.answer);
    return { valid };
  }
}