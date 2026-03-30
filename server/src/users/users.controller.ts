import { Controller, Get, Post, Patch, Body, Req, UseGuards, Param, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req: any, @Body() dto: CreateUserDto) {
    return this.usersService.create(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  findMe(@Req() req: any) {
    return this.usersService.findOne(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  update(@Req() req: any, @Body() dto: Partial<CreateUserDto>) {
    return this.usersService.update(req.user.id, dto);
  }

  @Get('by-username/:username')
async findByUsername(@Param('username') username: string) {
  const user = await this.usersService.findByUsername(username)
  if (!user) throw new NotFoundException('Utilisateur introuvable')
  return user
}
}