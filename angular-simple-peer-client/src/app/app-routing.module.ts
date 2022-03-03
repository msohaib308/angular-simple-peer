import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ModalModule } from 'ngx-bootstrap/modal';

const routes: Routes = [
  { path: '', loadChildren: () => import('./meets/meets.module').then(m => m.MeetsModule) },
];

@NgModule({
  imports: [RouterModule.forRoot(routes),
    ModalModule.forRoot()],
  exports: [RouterModule]
})
export class AppRoutingModule { }
