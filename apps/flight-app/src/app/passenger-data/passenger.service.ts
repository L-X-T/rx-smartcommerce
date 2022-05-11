import { Injectable } from '@angular/core';
import { EntityCollectionServiceBase, EntityCollectionServiceElementsFactory } from '@ngrx/data';
import { DataPassenger } from '../+state/data';

@Injectable({
  providedIn: 'root'
})
export class PassengerService extends EntityCollectionServiceBase<DataPassenger> {
  constructor(serviceElementsFactory: EntityCollectionServiceElementsFactory) {
    super('Passenger', serviceElementsFactory);
  }
}
