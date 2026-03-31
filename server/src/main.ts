import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // CORS: En production, le frontend est servi par le même backend (same-origin)
  // En dev, on a besoin d'accepter localhost:5173
  app.enableCors({
    origin: true, // Accept all origins locally, on Render they'll be same-origin
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  })

  await app.listen(process.env.PORT ?? 3000)
}
bootstrap()