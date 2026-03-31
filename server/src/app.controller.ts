import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getRoot(@Res() res: Response) {
    // Frontend is served as static files, no redirect needed
    return res.status(200).json({
      message: this.appService.getHello(),
      note: 'Frontend is served as static files. Visit / to access it.',
    });
  }
}
