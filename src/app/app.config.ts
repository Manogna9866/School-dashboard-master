import { APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { AuthService } from './core/auth/auth';
import { authInterceptor } from './core/interceptors/auth-interceptor';
import { errorInterceptor } from './core/interceptors/error-interceptor';
import { loaderInterceptor } from './core/interceptors/loader-interceptor';

providers: [
  {
    provide: APP_INITIALIZER,
    useFactory: initAuth,
    deps: [AuthService],
    multi: true
  }
]


export const appConfig: ApplicationConfig = {
  providers: [
    // 🔥 THIS IS THE FIX
    provideZoneChangeDetection(),

    provideRouter(routes),

    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor, loaderInterceptor])
    )
  ]
};

export function initAuth(auth: AuthService) {
  return () => auth.init();
}
