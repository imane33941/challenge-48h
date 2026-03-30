import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ExercisesService } from './exercises.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('exercises')
export class ExercisesController {
  constructor(private exercisesService: ExercisesService) {}

  @Post()
  create(@Body() dto: CreateExerciseDto) {
    return this.exercisesService.create(dto);
  }

  @Post('bulk')
  createMany(@Body() exercises: CreateExerciseDto[]) {
    return this.exercisesService.createMany(exercises);
  }

  @Get()
  findAll(
    @Query('niveau') niveau?: number,
    @Query('serie') serie?: number,
  ) {
    return this.exercisesService.findAll(niveau, serie);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.exercisesService.findOne(id);
  }
}