import { Component, OnInit } from '@angular/core';
import { PassengerService } from '../passenger.service';
import { DataPassenger } from '../../+state/data';
import { Observable } from 'rxjs';

@Component({
  selector: 'flight-workspace-passenger',
  templateUrl: './passenger.component.html',
  styleUrls: ['./passenger.component.css']
})
export class PassengerComponent implements OnInit {
  constructor(private passengerService: PassengerService) {}

  passengers$: Observable<DataPassenger[]>;
  loading$: Observable<boolean>;

  ngOnInit(): void {
    this.passengers$ = this.passengerService.entities$;
    this.loading$ = this.passengerService.loading$;
  }

  load(): void {
    this.passengerService.getAll();
  }

  add(): void {
    this.passengerService.add({ id: 0, name: 'Muster', firstName: 'Max' });
  }
}
