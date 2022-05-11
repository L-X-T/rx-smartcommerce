import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PassengerComponent } from './passenger/passenger.component';
import { RouterModule } from '@angular/router';
import { DefaultDataServiceConfig } from '@ngrx/data';

@NgModule({
  declarations: [PassengerComponent],
  imports: [
    CommonModule,
    RouterModule.forChild([
      {
        path: 'passenger-data',
        component: PassengerComponent
      }
    ])
  ],
  providers: [
    {
      provide: DefaultDataServiceConfig,
      useValue: {
        root: 'http://www.angular.at/api'
      }
    }
  ]
})
export class PassengerDataModule {}
