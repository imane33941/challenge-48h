import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase/supabase.module';
import { ProfilesModule } from './profiles/profiles.module';
import { ExercisesModule } from './exercises/exercises.module';
import { ProgressModule } from './progress/progress.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    SupabaseModule,
    ProfilesModule,
    ExercisesModule,
    ProgressModule,
  ],
})
export class AppModule {}