import { Component, OnDestroy, OnInit } from '@angular/core';
import { AirportService } from '@flight-workspace/flight-lib';
import { Observable, Observer, of, Subject, Subscription } from 'rxjs';
import { catchError, delay, share, takeUntil } from 'rxjs/operators';

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

  // isLoading & isError flags
  isLoading = true;
  isError = false;
  isLoadingTakeUntil = true;
  isErrorTakeUntil = false;

  asyncAirports$: Observable<string[]>; // return empty array on error

  constructor(private airportService: AirportService) {}

  ngOnInit(): void {
    this.airports$ = this.airportService.findAll().pipe(delay(3000), share());

    this.asyncAirports$ = this.airports$.pipe(catchError((err) => of([])));

    this.airportsObserver = {
      next: (airports) => {
        this.isLoading = false;
        this.airports = airports;
      },
      error: (err) => {
        this.isLoading = false;
        this.isError = true;
        console.error(err);
      },
      complete: () => console.log('Observable completed!')
    };

    // Unsubscribe with Subscription
    this.airportsSubscription = this.airports$.subscribe(this.airportsObserver);

    // Unsubscribe with takeUntil Subject
    this.airports$.pipe(takeUntil(this.onDestroySubject)).subscribe({
      next: (airports) => {
        this.takeUntilAirports = airports;
        this.isLoadingTakeUntil = false;
      },
      error: (err) => {
        this.isLoadingTakeUntil = false;
        this.isErrorTakeUntil = true;
        console.error(err);
      },
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
