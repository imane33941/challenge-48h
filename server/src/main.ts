import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  const normalizeOrigin = (value: string) => value.replace(/\/$/, '')

  const allowedOrigins = new Set(
    [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      process.env.FRONTEND_URL ?? '',
    ]
      .filter(Boolean)
      .map(normalizeOrigin)
  )

  app.enableCors({
    origin: (origin, callback) => {
      // Allow non-browser calls (curl, server-to-server) and configured frontend origins.
      if (!origin) return callback(null, true)
      if (allowedOrigins.has(normalizeOrigin(origin))) return callback(null, true)
      return callback(new Error('Not allowed by CORS'))
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  })

  await app.listen(process.env.PORT ?? 3000)
}
bootstrap()