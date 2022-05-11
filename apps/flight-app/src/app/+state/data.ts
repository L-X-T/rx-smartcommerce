import { EntityMetadataMap, EntityDataModuleConfig, DefaultDataServiceConfig } from '@ngrx/data';
import { Passenger } from '../passengers/passenger.model';

export interface DataPassenger {
  id: number;
  firstName: string;
  name: string;
}

const entityMetadata: EntityMetadataMap = {
  Passenger: {
    selectId: (p: Passenger) => p.id // == Default
  }
};

export const pluralNames = { Passenger: 'passenger' }; // Web API Singular

export const entityConfig: EntityDataModuleConfig = {
  entityMetadata,
  pluralNames
};

export const defaultDataServiceConfig: DefaultDataServiceConfig = {
  root: 'http://www.angular.at/api'
};
