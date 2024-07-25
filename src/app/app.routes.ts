import { Routes } from '@angular/router';
import { MainPageComponent } from './main-page/main-page.component';
import { MapContainerComponent } from './map-container/map-container.component';

export const routes: Routes = [
    {path:'',component:MainPageComponent},
    {path:'map/:id',component:MapContainerComponent},
    {path:'**',component:MainPageComponent}
];
