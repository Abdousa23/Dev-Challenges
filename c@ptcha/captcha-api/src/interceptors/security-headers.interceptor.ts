import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
@Injectable()
export class SecurityHeadersInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler) {
        const res = context.switchToHttp().getResponse();

        res.setHeader('Content-Security-Policy', "default-src 'self'");
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

        return next.handle();
    }
}