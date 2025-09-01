import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    console.log(process.env.FRONT_URL);
    return 'Hello World!';
  }
}
