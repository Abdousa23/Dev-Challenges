import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SecurityHeadersInterceptor } from './interceptors/security-headers.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalInterceptors(new SecurityHeadersInterceptor())
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
