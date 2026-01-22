import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class NotifyService {
  success(msg: string) {
    console.log('✅', msg);
  }

  error(msg: string) {
    console.error('❌', msg);
  }

  info(msg: string) {
    console.info('ℹ️', msg);
  }
}
