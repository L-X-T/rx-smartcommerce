import { Component, OnDestroy, OnInit } from '@angular/core';
import { AirportService } from '@flight-workspace/flight-lib';
import { Observable, Observer, Subscription } from 'rxjs';

@Component({
  selector: 'flight-workspace-airport',
  templateUrl: './airport.component.html',
  styleUrls: ['./airport.component.css']
})
export class AirportComponent implements OnInit, OnDestroy {
  airports$: Observable<string[]>;
  airportsObserver: Observer<string[]>;

  // Unsubscribe with Subscription
  airports: string[] = [];
  airportsSubscription: Subscription;

  constructor(private airportService: AirportService) {}

  ngOnInit(): void {
    this.airports$ = this.airportService.findAll();

    this.airportsObserver = {
      next: (airports) => (this.airports = airports),
      error: (err) => console.error(err),
      complete: () => console.log('Observable completed!')
    };

    // Unsubscribe with Subscription
    this.airportsSubscription = this.airports$.subscribe(this.airportsObserver);
  }

  ngOnDestroy(): void {
    // Unsubscribe with Subscription
    this.airportsSubscription?.unsubscribe();
  }
}
