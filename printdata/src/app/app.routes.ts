import { Routes } from '@angular/router';
import { Print } from './print';
import { Home } from './home';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'print', component: Print },
  {
    path: 'barcode',
    loadComponent: () => import('./barcode').then(m => m.BarcodeLabelComponent)
  }
];
