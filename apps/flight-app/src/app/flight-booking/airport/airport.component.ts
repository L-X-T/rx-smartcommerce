import { Component, OnDestroy, OnInit } from '@angular/core';
import { AirportService } from '@flight-workspace/flight-lib';
import { Observable, Observer, Subject, Subscription } from 'rxjs';
import { share, takeUntil } from 'rxjs/operators';

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

  // Unsubscribe with takeUntil Subject
  takeUntilAirports: string[] = [];
  onDestroySubject = new Subject<void>();

  constructor(private airportService: AirportService) {}

  ngOnInit(): void {
    this.airports$ = this.airportService.findAll().pipe(share());

    this.airportsObserver = {
      next: (airports) => (this.airports = airports),
      error: (err) => console.error(err),
      complete: () => console.log('Observable completed!')
    };

    // Unsubscribe with Subscription
    this.airportsSubscription = this.airports$.subscribe(this.airportsObserver);

    // Unsubscribe with takeUntil Subject
    this.airports$.pipe(takeUntil(this.onDestroySubject)).subscribe({
      next: (airports) => (this.takeUntilAirports = airports),
      error: (err) => console.error(err),
      complete: () => console.log('Take until Observable completed!')
    });
  }

  ngOnDestroy(): void {
    // Unsubscribe with Subscription
    this.airportsSubscription?.unsubscribe();

    // Unsubscribe with takeUntil Subject
    this.onDestroySubject.next();
    this.onDestroySubject.complete();
  }
}
