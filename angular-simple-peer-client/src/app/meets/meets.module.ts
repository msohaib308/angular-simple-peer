import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MeetsRoutingModule } from './meets-routing.module';
import { LiveRoomComponent } from './live-room/live-room.component';


@NgModule({
  declarations: [
    LiveRoomComponent
  ],
  imports: [
    CommonModule,
    MeetsRoutingModule
  ]
})
export class MeetsModule { }
