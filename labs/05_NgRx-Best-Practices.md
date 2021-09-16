#NGRX Best Practices

In dieser Übung werden wir die ngrx Best Practices auf die Passagieradministration anwenden.

- [Vorbereitung](#vorbereitung)
- [1. LoadStatus & Caching](#1-loadstatus--caching)
- [2. Container & Presentation Component](#2-container--presentation-component)
- [3. Facade](#3-facade)
- [4. StateModel & ViewModel](#4-statemodel--viewmodel)
- [Bonus 1: Simples StateModel vs. ViewModel](#bonus-1-simples-statemodel-vs-viewmodel)
- [Bonus 2: Modularisierung](#bonus-2-modularisierung)
- [Bonus 3: Umsetzung mit @ngrx/entity](#bonus-3-umsetzung-mit-ngrxentity)
- [Bonus 4: Umsetzung mit @ngrx/data](#bonus-4-umsetzung-mit-ngrxdata)
- [Bonus 5: Testing](#bonus-5-testing)

## Vorbereitung

**Sollte ausreichend Zeit sein, so kann die Vorbereitung von den Teilnehmern selbständig ohne bereitgestellter Lösungen durchgeführt werden. Da hier fortgeschrittene Konzepte vorgestellt werden, sollten die Teilnehmer auch auf dem Niveau sein, dies selbständig zu lösen.**

Alternativ kann man auch das gesamte Projekte aus dem Unterordner kopieren.

1. Wir generieren ein eigenes Modul für die Passenger:

```bash
npx ng g m passenger
```

2. Wir generieren den Boilerplate Code für den passenger state:

```bash
npx ng g f passenger/+state/Passenger -m passenger -a false --creators --spec false
```

3. In der `app.module` das `PassengerModule` importieren und, falls nicht bereits gemacht, StoreModule und EffectsModule importieren.

4. In der `sidebar.component.html` einen Link auf `/passenger` hinzufügen.

5. Wir generieren die Komponenten für die Listen- und Detailansicht:

```bash
npx ng g c passenger/passengers --skipTests -f -is
npx ng g c passenger/passengers --skipTests -f -is
```

Weitere Vervollständigung des Passenger Moduls:

`passenger.ts`:

```typescript
export interface Passenger {
  id: number;
  firstName: string;
  name: string;
  bonusMiles: number;
  passengerStatus: string;
}
```

`passenger.module`:

```typescript
@NgModule({
  declarations: [PassengersComponent, PassengerComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild([
      {
        path: 'passenger',
        children: [
          {
            path: '',
            component: PassengersComponent,
          },
          {
            path: ':id',
            component: PassengerComponent,
          },
        ],
      },
    ]),
    StoreModule.forFeature(fromPassenger.passengerFeatureKey, fromPassenger.reducer),
    EffectsModule.forFeature([PassengerEffects]),
  ],
})
export class PassengerModule {}
```

`passenger.actions.ts`

```typescript
const load = createAction('[Passenger] Load');
const loaded = createAction('[Passenger] Loaded', props<{ passengers: Passenger[] }>());

const add = createAction('[Passenger] Add', props<{ passenger: Passenger }>());
const added = createAction('[Passenger] Added', props<{ passenger: Passenger }>());

const update = createAction('[Passenger] Update', props<{ passenger: Passenger }>());
const updated = createAction('[Passenger] Updated', props<{ passenger: Passenger }>());

export const PassengerActions = {
  load,
  loaded,
  add,
  added,
  update,
  updated,
};
```

`passenger.reducer.ts`

```typescript
export const passengerFeatureKey = 'passenger';

export interface State {
  passengers: Passenger[];
}

export interface PassengerAppState {
  [passengerFeatureKey]: State;
}

export const initialState: State = {
  passengers: [],
};

const passengerReducer = createReducer<State>(
  initialState,
  on(PassengerActions.loaded, (state, { passengers }) => ({
    ...state,
    passengers,
  })),
  on(PassengerActions.added, (state, { passenger }) => ({
    ...state,
    passengers: [...state.passengers, passenger],
  })),
  on(PassengerActions.updated, (state, { passenger }) => ({
    ...state,
    passengers: [...state.passengers.filter((p) => p.id !== passenger.id), passenger],
  }))
);

export function reducer(state: State | undefined, action: Action) {
  return passengerReducer(state, action);
}
```

`passenger.selector.ts`

```typescript
const selectPassengerState = createFeatureSelector<State>(passengerFeatureKey);

const selectAll = createSelector(selectPassengerState, (state) => state.passengers);

const selectById = createSelector(selectAll, (state: Passenger[], id: number) => state.find((p) => p.id === id));

export const fromPassenger = {
  selectAll,
  selectById,
};
```

`passenger.effects.ts`

```
@Injectable()
export class PassengerEffects {
  private baseUrl = "http://www.angular.at/api/passenger";
  constructor(private actions$: Actions, private http: HttpClient) {}

  loadPassengers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PassengerActions.load),
      switchMap(() => this.http.get<Passenger[]>(this.baseUrl)),
      map(passengers => PassengerActions.loaded({ passengers }))
    )
  );

  addPassenger$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PassengerActions.add),
      switchMap(({ passenger }) =>
        this.http.post<Passenger>(this.baseUrl, passenger)
      ),
      map(passenger => PassengerActions.added({ passenger }))
    )
  );

  updatePassenger$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PassengerActions.update),
      switchMap(({ passenger }) =>
        this.http.post<Passenger>(this.baseUrl, passenger)
      ),
      map(passenger => PassengerActions.updated({ passenger }))
    )
  );
}
```

`passengers.component.ts`

```typescript
@Component({
  selector: 'app-passengers',
  templateUrl: './passengers.component.html',
})
export class PassengersComponent implements OnInit {
  passengers$: Observable<Passenger[]>;

  constructor(private store: Store<PassengerAppState>) {}

  ngOnInit() {
    this.store.dispatch(PassengerActions.load());
    this.passengers$ = this.store.select(fromPassenger.selectAll);
  }
}
```

`passengers.component.html`

```html
<p><a [routerLink]="['.', 0]">Add Passenger</a></p>
<ul *ngIf="passengers$ | async as passengers">
  <li *ngFor="let passenger of passengers">
    <a [routerLink]="['.', passenger.id]">{{ passenger.firstName }} {{ passenger.name }}</a>
  </li>
</ul>
```

`passenger.component.ts`

```typescript
@Component({
  selector: 'app-passenger',
  templateUrl: './passenger.component.html',
})
export class PassengerComponent implements OnInit {
  formGroup: FormGroup;
  passenger$: Observable<Passenger>;

  constructor(
    private store: Store<PassengerAppState>,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.formGroup = this.fb.group({
      id: [0],
      firstName: ['', Validators.required],
      name: ['', Validators.required],
      bonusMiles: [],
      passengerStatus: [''],
    });
    this.store.dispatch(PassengerActions.load());
    this.store
      .select(fromPassenger.selectById, Number(this.route.snapshot.params.id))
      .pipe(
        filter((passenger) => !!passenger),
        first()
      )
      .subscribe((passenger) => this.formGroup.setValue(passenger));
  }

  submit() {
    if (this.formGroup.valid) {
      const passenger = this.formGroup.value as Passenger;
      if (passenger.id) {
        this.store.dispatch(PassengerActions.update({ passenger }));
      } else {
        this.store.dispatch(PassengerActions.add({ passenger }));
      }
      this.router.navigateByUrl('/passenger');
    }
  }
}
```

`passenger.component.html`

```html
<form [formGroup]="formGroup" (ngSubmit)="submit()">
  <div class="form-group">
    <label>Firstname</label>
    <input type="text" class="form-control" formControlName="firstName" />
  </div>
  <div class="form-group">
    <label>Name</label>
    <input type="text" class="form-control" formControlName="name" />
  </div>
  <div class="form-group">
    <label>Bonus Miles</label>
    <input type="text" class="form-control" formControlName="bonusMiles" />
  </div>
  <div class="form-group">
    <label>Passenger Status</label>
    <input type="text" class="form-control" formControlName="passengerStatus" />
  </div>
  <div>
    <a [routerLink]="['..']">Back</a>
    &nbsp;
    <button type="submit">Save</button>
  </div>
</form>
```

## 1. LoadStatus & Caching

Wir stellen sicher, dass bei den verwendeten Komponenten, die Passagierliste geladen wird, bevor überhaupt eine Component gerendert wird. Damit muss jede Komponente nicht mehr selber die load Action auslösen oder in Gefahr zu laufen, dass gar keine Daten vorhanden sind.

Dies erreichen wir durch das Zusammenspiel zwischen State, Component und Guard.

Es wird eine neue Action definiert, welche einen Effekt auslöst, der überprüft ob die Daten bereits geladen sind oder nicht. Bei Zweitem führt der Effekt die eigentliche loadAction aus. Der Reducer setzt beim Laden den LoadingStatus auf Loading setzen und beim Eintreffen der Daten auf Loaded.

1. `passengers.actions`:

```typescript
const get = createAction('[Passenger] Get');
```

Die neue Action muss natürlich auch in den `PassengerActions` mitaufgenommen werden.

2. `passengers.reducer`: Es wird ein LoadStatus hinzugefügt und der State selber um das entsprechende Property erweitert. Der Reducer wird auch überarbeitet.

```typescript
export enum LoadStatus {
  NOT_LOADED,
  LOADING,
  LOADED,
}

export interface State {
  passengers: Passenger[];
  loadStatus: LoadStatus;
}

export interface PassengerAppState {
  [passengerFeatureKey]: State;
}

export const initialState: State = {
  passengers: [],
  loadStatus: LoadStatus.NOT_LOADED,
};

const passengerReducer = createReducer<State>(
  initialState,
  on(PassengerActions.load, (state) => ({
    ...state,
    loadStatus: LoadStatus.LOADING,
  })),
  on(PassengerActions.loaded, (state, { passengers }) => ({
    ...state,
    passengers,
    loadStatus: LoadStatus.LOADED,
  })),
  on(PassengerActions.added, (state, { passenger }) => ({
    ...state,
    passengers: [...state.passengers, passenger],
  })),
  on(PassengerActions.updated, (state, { passenger }) => ({
    ...state,
    passengers: [...state.passengers.filter((p) => p.id !== passenger.id), passenger],
  }))
);

export function reducer(state: State | undefined, action: Action) {
  return passengerReducer(state, action);
}
```

3. `passengers.selectors`: Zwei neue Selektoren für den LoadStatus. Export nicht vergessen!

```typescript
const selectLoadStatus = createSelector(selectPassengerState, (state) => state.loadStatus);

const hasLoaded = createSelector(selectLoadStatus, (status) => status === LoadStatus.LOADED);

export const fromPassenger = {
  selectAll,
  selectById,
  selectLoadStatus,
  hasLoaded,
};
```

4. `passengers.effects`: Weiters wird ein Effekt hinzugefügt, welcher überprüft, ob der State überhaupt geladen werden muss oder nicht. Falls ja, wird der Effekt die eigentliche Action triggern. Beim Constructor des Effekts-Services den Store injecten.

```typescript
getPassenger$ = createEffect(() =>
  this.actions$.pipe(
    ofType(PassengerActions.get),
    switchMap((action) => of(action).pipe(withLatestFrom(this.store.select(fromPassenger.selectLoadStatus)))),
    filter(([, loadStatus]) => loadStatus === LoadStatus.NOT_LOADED),
    map(() => PassengerActions.load())
  )
);

loadPassenger$ = createEffect(() =>
  this.actions$.pipe(
    ofType(PassengerActions.load),
    switchMap(() => this.http.get<Passenger[]>(this.baseUrl)),
    map((passengers) => PassengerActions.loaded({ passengers }))
  )
);
```

5. `passenger-data.guard`: Ein Guard, welcher einerseits die get Action triggert und überprüft, ob der LoadStatus auch geladen ist:

```bash
npx ng g g passenger/passengerData --implements CanActivate --skipTests true
```

```typescript
export class PassengerDataGuard implements CanActivate {
  constructor(private store: Store<PassengerAppState>) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree> {
    this.store.dispatch(PassengerActions.get());
    return this.store.select(fromPassenger.hasLoaded).pipe(filter((hasLoaded) => !!hasLoaded));
  }
}
```

6. `passenger.module.ts`: Weiters müssen wir im Router noch den Route Guard aktivieren:

```typescript
RouterModule.forChild([
  {
    path: 'passenger',
    canActivate: [PassengerDataGuard],
    children: [
      {
        path: '',
        component: PassengersComponent,
      },
      {
        path: ':id',
        component: PassengerComponent,
      },
    ],
  },
]);
```

7. Die load Actions in `passengers.component` sowie `passenger.component` können nun entfernt werden. Auch deep Links funktionieren.

## 2. Container & Presentation Component

Wir müssen beide Komponenten in je eine Container und Presentation Component unterteilen:

```bash
npx ng g c passenger/passengersContainer
```

`passengers-container.component`

```typescript
export class PassengersContainerComponent implements OnInit {
  passengers$: Observable<Passenger[]>;

  constructor(private store: Store<PassengerAppState>) {}

  ngOnInit() {
    this.passengers$ = this.store.select(fromPassenger.selectAll);
  }
}
```

```html
<app-passengers *ngIf="passengers$ | async as passengers" [passengers]="passengers"></app-passengers>
```

Sollte man den DataGuard Ansatz von oben anwenden, wird das `ngIf` nicht benötigt, da die Passengers bereits geladen wurden.

`passengers.component`

```typescript
export class PassengersComponent {
  @Input() passengers: Passenger[];
}
```

Im html kann danach über die `passengers` iteriert werden ohne die `async` pipe.

```bash
npx ng g c passenger/passengerContainer
```

`passenger-container.component`

```typescript
const emptyPassenger = {
  id: 0,
  name: '',
  firstName: '',
  bonusMiles: 0,
  passengerStatus: 'A',
};

@Component({
  selector: 'app-passenger-container',
  templateUrl: './passenger-container.component.html',
  styleUrls: ['./passenger-container.component.css'],
})
export class PassengerContainerComponent implements OnInit {
  passenger$: Observable<Passenger>;

  constructor(private store: Store<PassengerAppState>, private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.params.id);

    if (id) {
      this.passenger$ = this.store.select(fromPassenger.selectById, id).pipe(
        filter((passenger) => !!passenger),
        first()
      );
    } else {
      this.passenger$ = of(emptyPassenger);
    }
  }

  submitted(passenger: Passenger) {
    if (passenger.id) {
      this.store.dispatch(PassengerActions.update({ passenger }));
    } else {
      this.store.dispatch(PassengerActions.add({ passenger }));
    }
    this.router.navigateByUrl('/passenger');
  }
}
```

```html
<app-passenger
  *ngIf="passenger$ | async as passenger"
  [passenger]="passenger"
  (submitted)="submitted($event)"
></app-passenger>
```

Auch hier gilt wieder, dass bei einem aktiven DataGuard die condition im Template nicht benötigt wird.

`passenger.component`

```typescript
export class PassengerComponent implements OnInit {
  @Input() passenger: Passenger;
  @Output() submitted = new EventEmitter<Passenger>();
  formGroup: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.formGroup = this.fb.group({
      id: [0],
      firstName: ['', Validators.required],
      name: ['', Validators.required],
      bonusMiles: [],
      passengerStatus: [''],
    });
    this.formGroup.setValue(passenger);
  }

  submit() {
    if (this.formGroup.valid) {
      this.submitted.emit(this.formGroup.value as Passenger);
    }
  }
}
```

**Nicht vergessen im Router die Container Components zu verwenden.**

## 3. Facade

Wir kapseln die ngrx-eigenen Elemente und ihr Zusammenspiel in einem Modul und geben nach außen hin die Funktionalität als Facade frei. Damit gewinnen wir die Möglichkeit bestimmte Actions nur intern verfügbar zu machen. Bspw. Actions, die ausschließlich von Effekts ausgelöst werden.

`passenger-facade.ts`

```typescript
@Injectable({
  providedIn: 'root',
})
export class PassengerFacade {
  get passengers$(): Observable<Passenger[]> {
    return this._passengers$;
  }

  get isLoaded$(): Observable<boolean> {
    return this.store.select(fromPassenger.hasLoaded);
  }

  get emptyPassenger(): Passenger {
    return {
      id: 0,
      name: '',
      firstName: '',
      bonusMiles: 0,
      passengerStatus: 'A',
    };
  }

  private _passengers$: Observable<Passenger[]>;

  constructor(private store: Store<PassengerAppState>) {
    this._passengers$ = this.store.select(fromPassenger.selectAll);
  }

  public getById(id: number) {
    return this.store.select(fromPassenger.selectById, id);
  }

  public add(passenger: Passenger) {
    this.store.dispatch(PassengerActions.add({ passenger }));
  }

  public update(passenger: Passenger) {
    this.store.dispatch(PassengerActions.update({ passenger }));
  }

  public load() {
    this.store.dispatch(PassengerActions.get());
  }
}
```

Wir tauschen danach den Store mit der Facade in folgenden Komponenten/Services aus:

- PassengerDataGuard
- PassengersContainer
- PassengerContainer

Insbesonder die `passengers-container.component.ts` wird dadurch kürzer:

```typescript
export class PassengersContainerComponent {
  constructor(public facade: PassengerFacade) {}
}
```

```html
<app-passengers [passengers]="facade.passengers$ | async"></app-passengers>
```

## 4. StateModel & ViewModel

Jede UI-Komponent ein anderes Datenmodell auf. Es kann einen Teil des StateModels oder aber eine Kombination von verschiedenen States sein. In diesem Beispiel behandeln wir einen Extremfall, damit die Unterschiede besser zur Geltung kommen.

Hier erweitern wir das Passenger Formular um die Anzeige der aktuellen Buchungen. Sollte die Buchung noch stornierbar sein und der aktuelle User der Passagier sein, ist ein Storno Button aktiv. Sollte stornierbar, aber nicht aktueller User sein, ist der Button deaktiviert. Ansonsten fehlt er komplett.

Für diesen Zweck definiert die Presentation Component ihr eigenes ViewModel und es liegt in der Verantwortung der Container Component die vorhandenen StateModels in das ViewModel überzuführen.

Flüge und User werden von zwei verschiedenen Facades bedient, die jeweils einen kompletten ngrx Feature State verwenden und aus verschiedenen Modulen kommen. Zwecks Vereinfachung verwenden wir hier jedoch nur Observables.

Wir erweitern die Passenger Component um das ViewModel und adaptieren das Template.

`passenger.component`

Das ViewModel definieren:

```typescript
interface Booking {
  id: number;
  name: string;
  cancelStatus: 'none' | 'cancellable' | 'notCancellable';
}

export interface PassengerViewModel extends Passenger {
  bookings: Booking[];
}
```

Den Input ändern auf:

```typescript
@Input() passenger: PassengerViewModel;
```

Die FormGroup muss um den `bookings` Array erweitert werden:

```typescript
this.formGroup = this.fb.group({
  id: [0],
  firstName: [''],
  name: ['', Validators.required],
  bonusMiles: ['', Validators.required],
  passengerStatus: ['', Validators.required],
  bookings: [''],
});
```

Unter dem Formular die Buchungsliste hinzufügen

```html
<h3>Buchungen: {{ passenger.bookings.length }}</h3>
<div *ngFor="let booking of passenger.bookings">
  {{ booking.name }}&nbsp;
  <button *ngIf="booking.cancelStatus !== 'none'" [disabled]="booking.cancelStatus === 'notCancellable'">Cancel</button>
</div>
```

`booking.facade`

```typescript
export interface Booking {
  id: number;
  passengerId: number;
  from: string;
  to: string;
  cancellable: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class BookingFacadeService {
  constructor() {}

  get bookings$(): Observable<Booking[]> {
    return of([
      {
        id: 1,
        passengerId: 1,
        from: 'Wien',
        to: 'London',
        cancellable: false,
      },
      {
        id: 2,
        passengerId: 1,
        from: 'London',
        to: 'Wien',
        cancellable: false,
      },
      {
        id: 3,
        passengerId: 1,
        from: 'Frankfurt',
        to: 'Tokio',
        cancellable: true,
      },
      {
        id: 4,
        passengerId: 1,
        from: 'Tokio',
        to: 'Frankfurt',
        cancellable: true,
      },
      {
        id: 5,
        passengerId: 2,
        from: 'Madrid',
        to: 'Helsinki',
        cancellable: true,
      },
    ]);
  }
}
```

`user.facade`

```typescript
export interface User {
  fullName: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserFacadeService {
  constructor() {}

  get user$() {
    return of({ fullName: 'Max Muster' });
  }
}
```

`passenger.container.component`

```typescript
export class PassengerContainerComponent implements OnInit {
  passengerViewModel$: Observable<PassengerViewModel>;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private facade: PassengerFacade,
    private userFacade: UserFacadeService,
    private bookingFacade: BookingFacadeService
  ) {}

  ngOnInit() {
    const passenger$ = this.route.params.pipe(
      switchMap(({ id }) => {
        if (id === '0') {
          return of(this.facade.emptyPassenger);
        } else {
          return this.facade.getById(Number(id)).pipe(first());
        }
      })
    );

    this.passengerViewModel$ = combineLatest([passenger$, this.userFacade.user$, this.bookingFacade.bookings$]).pipe(
      map(([passenger, currentUser, bookings]) => this.mapToViewModel(passenger, currentUser, bookings))
    );
  }

  mapToViewModel(passenger: Passenger, currentUser: User, bookings: Booking[]): PassengerViewModel {
    const isCurrentUser = currentUser.fullName === `${passenger.firstName} ${passenger.name}`;
    return {
      ...passenger,
      bookings: bookings
        .filter((booking) => booking.passengerId === passenger.id)
        .map((booking) => ({
          id: booking.id,
          name: `${booking.from} - ${booking.to}`,
          cancelStatus: this.getCancelStatus(isCurrentUser, booking.cancellable),
        })),
    };
  }

  getCancelStatus(isCurrentUser: boolean, isCancellable: boolean) {
    if (!isCurrentUser) {
      return 'none';
    }

    return isCancellable ? 'cancellable' : 'notCancellable';
  }
  submitted(passenger: Passenger) {
    if (passenger.id) {
      this.facade.update(passenger);
    } else {
      this.facade.add(passenger);
    }
    this.router.navigateByUrl('/passenger');
  }
}
```

```html
<app-passenger
  *ngIf="passengerViewModel$ | async as passenger"
  [passenger]="passenger"
  (submitted)="submitted($event)"
></app-passenger>
```

Bei Max Mustermann sehen wir 4 Buchungen, wobei nur die letzten beiden stornierbar sind. Susi Sorglos hat nur eine Buchung, allerdings fehlt der Stornierbutton komplett, da sie ja nicht der aktive User ist.

Es lohnt sich den Code in `passenger-container.component.ts` näher zu studieren. Ein derartiges extremes Anwendungsbeispiel ist nicht so weit von der Realität entfern, wie man vielleicht vermuten mag...

## Bonus 1: Simples StateModel vs. ViewModel

In nahezu jedem Formular gibt es Selectboxen, wo man aus vordefinierten Werten wählen muss. Diese Werte sind sehr häufig auch die sogenannten "Stammdaten". Sie befinden sich in einem separaten Store.

Erweitern Sie das Passagierfomular aus der Ausgangsversion und fügen Sie ein DropDown für die Auswahl des präferierten Flughafens hinzu. Die Flughafenliste soll in einem anderen FeatureState gespeichert sein.

## Bonus 2: Modularisierung

Teilen Sie die 3 Bereiche state, container und presentation components jeweils in eigenes Modul auf. Die empfohlene Namenskonvention richtet sich hier nach nx. Diese Übungen sollte überdies in einem nx Workspace erstellt werden, um Regeln für die Modulabhängigkeiten erstellen zu können.

- State Management: `/libs/passenger/data`;
- Container Components: `/libs/passenger/feature`;
- Presentation Components: `/libs/passenger/ui`;

## Bonus 3: Umsetzung mit @ngrx/entity

## Bonus 4: Umsetzung mit @ngrx/data

## Bonus 5: Testing

In diesen Übungen werden Unit Tests geschrieben, die die Container Komponenten, Effekte, Reducer sowie den Guard abdecken.
