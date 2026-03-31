import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getRoot(@Res() res: Response) {
    const frontendUrl = process.env.FRONTEND_URL;

    // If a frontend URL is configured, route users to the login page first.
    if (frontendUrl) {
      return res.redirect(`${frontendUrl.replace(/\/$/, '')}/login`);
    }

    return res.status(200).json({
      message: this.appService.getHello(),
      hint: 'Set FRONTEND_URL to redirect to the login page.',
    });
  }
}
