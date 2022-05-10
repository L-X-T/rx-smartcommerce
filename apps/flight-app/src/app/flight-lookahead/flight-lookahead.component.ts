import { Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Flight, FlightService } from '@flight-workspace/flight-lib';
import { combineLatest, from, interval, merge, Observable, of, Subject } from 'rxjs';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, debounceTime, distinctUntilChanged, filter, map, pairwise, retry, startWith, switchMap, tap } from 'rxjs/operators';

@Component({
  selector: 'flight-workspace-flight-lookahead',
  templateUrl: './flight-lookahead.component.html',
  styleUrls: ['./flight-lookahead.component.css']
})
export class FlightLookaheadComponent implements OnInit {
  fromControl: FormControl;
  toControl: FormControl;

  flights$: Observable<Flight[]>;
  diff$: Observable<number>;
  loading: boolean;

  online = false;
  online$: Observable<boolean>;

  private refreshClickSubject = new Subject<void>();
  readonly refreshClick$ = this.refreshClickSubject.asObservable();

  constructor(private flightService: FlightService, private http: HttpClient) {}

  ngOnInit(): void {
    /*this.control = new FormControl();
    const input$ = this.control.valueChanges.pipe(debounceTime(300));*/

    this.fromControl = new FormControl();
    const fromInput$ = this.fromControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      // filter((input) => input.length > 2),
      distinctUntilChanged()
    );

    this.toControl = new FormControl();
    const toInput$ = this.toControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      // filter((input) => input.length > 2),
      distinctUntilChanged()
    );

    /*this.flights$ = this.control.valueChanges.pipe(
      debounceTime(300),
      filter((input) => input.length > 2),
      distinctUntilChanged(),
      tap((input) => (this.loading = true)),
      switchMap((input) => this.load(input)),
      tap((v) => (this.loading = false))
    );*/

    this.online$ = interval(2000).pipe(
      startWith(0),
      // map((_) => Math.random() < 0.5),
      map((_) => true), // deactivated online flag
      distinctUntilChanged(),
      tap((value) => (this.online = value))
    );

    const combined$ = combineLatest([fromInput$, toInput$, this.online$]).pipe(
      distinctUntilChanged(
        (x: [from: string, to: string, online: boolean], y: [from: string, to: string, online: boolean]) => x[0] === y[0] && x[1] === y[1]
      )
    );
    const refresh$ = this.refreshClick$.pipe(map((_) => [this.fromControl.value, this.toControl.value, this.online]));

    this.flights$ = merge(combined$, refresh$).pipe(
      filter(([f, t, online]) => (f || t) && online),
      map(([from, to, _]) => [from, to]),
      tap(([from, to]) => (this.loading = true)),
      switchMap(([from, to]) => this.loadFlights(from, to)),
      tap((a) => (this.loading = false))
    );

    this.diff$ = this.flights$.pipe(
      pairwise(),
      map(([a, b]) => b.length - a.length)
    );
  }

  loadFlights(from: string, to: string): Observable<Flight[]> {
    return this.flightService.find(from, to, false).pipe(
      retry(3), // you retry 3 times
      catchError((err) => {
        console.log('Error caught:');
        console.log(err);
        return of([]);
      }) // if all fail catch error
    );
  }

  refresh(): void {
    this.refreshClickSubject.next();
  }
}
