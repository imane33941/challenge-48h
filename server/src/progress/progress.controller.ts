import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ProgressService } from './progress.service';
import { CreateProgressDto } from './dto/create-progress.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('progress')
export class ProgressController {
  constructor(private progressService: ProgressService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateProgressDto) {
    return this.progressService.create(req.user.id, dto);
  }

  @Get()
  findMyProgress(@Req() req: any) {
    return this.progressService.findByUser(req.user.id);
  }

  @Get(':exerciseId')
  findOne(@Req() req: any, @Param('exerciseId') exerciseId: string) {
    return this.progressService.findByExercise(req.user.id, exerciseId);
  }
}