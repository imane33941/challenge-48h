import { Controller, Get, Post, Patch, Body, Req, UseGuards } from '@nestjs/common';
import { ProfilesService } from './profiles.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('profiles')
export class ProfilesController {
  constructor(private profilesService: ProfilesService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateProfileDto) {
    return this.profilesService.create(req.user.id, dto);
  }

  @Get('me')
  findMe(@Req() req: any) {
    return this.profilesService.findOne(req.user.id);
  }

  @Patch('me')
  update(@Req() req: any, @Body() dto: Partial<CreateProfileDto>) {
    return this.profilesService.update(req.user.id, dto);
  }
}