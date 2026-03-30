import { Controller, Get, Post, Patch, Body, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateUserDto) {
    return this.usersService.create(req.user.id, dto);
  }

  @Get('me')
  findMe(@Req() req: any) {
    return this.usersService.findOne(req.user.id);
  }

  @Patch('me')
  update(@Req() req: any, @Body() dto: Partial<CreateUserDto>) {
    return this.usersService.update(req.user.id, dto);
  }
}