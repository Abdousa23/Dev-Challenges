import { Controller, Post, Body, Get, Res, Req, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { CaptchaService } from './captcha.service';
import { Request, Response } from 'express';

@Controller('captcha')
export class CaptchaController {
  constructor(private readonly captchaService: CaptchaService) { }

  @Get('generate')
  async generate(@Req() req: Request, @Res() res: Response) {
    try {
      // Get IP address for rate limiting
      const ipAddress = req.ip || req.connection.remoteAddress;

      const { image, sessionId } = await this.captchaService.generateCaptcha(ipAddress);

      // Set appropriate headers
      console.log(sessionId)
      res.set('Content-Type', 'image/png');
      res.set('X-Session-Id', sessionId);
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');

      console.log(image)
      const imageUrl = `data:image/png;base64,${Buffer.from(image).toString("base64")}`;

      return res.status(200).json({
        imageUrl,
        sessionId
      });
    } catch (error) {
      if (error instanceof HttpException) {
        return res.status(error.getStatus()).json({
          statusCode: error.getStatus(),
          message: error.message
        });
      }

      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Error generating captcha'
      });
    }
  }

  @Post('validate')
  async validate(@Body() body: { sessionId: string; answer: string }) {
    try {
      console.log(body)
      if (!body.sessionId || !body.answer) {
        throw new HttpException('Session ID and answer are required', HttpStatus.BAD_REQUEST);
      }

      const valid = await this.captchaService.validateCaptcha(body.sessionId, body.answer);

      return { valid };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException('Error validating captcha', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}