import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { ExercisesModule } from './exercises/exercises.module';
import { ProgressModule } from './progress/progress.module';
import { GameModule } from './game/game.module';
import configuration from './config/configuration';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    SupabaseModule,
    AuthModule,
    UsersModule,
    ExercisesModule,
    ProgressModule,
    GameModule,
  ],
})
export class AppModule {}