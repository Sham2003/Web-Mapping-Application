import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { MapService } from './map-service/maps.service';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes),{
    provide:MapService
  }]
};
