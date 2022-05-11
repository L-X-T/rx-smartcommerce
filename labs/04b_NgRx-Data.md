# Managing Entities with @ngrx/data

1. Install ``@ngrx/data``:

    ```
    npm i @ngrx/data --save
    ```

2. Add a ``data.ts`` to your ``app/+state`` folder. Insert your data configuration:

    ```typescript
    import { EntityMetadataMap, EntityDataModuleConfig, DefaultDataServiceConfig } from "@ngrx/data";

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
    
    export const pluralNames = { Passenger: 'passenger' }; // Web API nutzt immer Singular

    export const entityConfig: EntityDataModuleConfig = {
        entityMetadata,
        pluralNames
    };
    
    export const defaultDataServiceConfig: DefaultDataServiceConfig = {
        root: 'http://www.angular.at/api'
    }
    ```

2. In your ``app.moduel.ts``, import the ``EntityDataModule``:

    ```typescript
    [...]
    imports: [
        [...],
        EntityDataModule.forRoot(entityConfig),
    ],
    [...]
    providers: [
    { 
      provide: DefaultDataServiceConfig, useValue: defaultDataServiceConfig 
    }
    [...]
    ]

    ```

    Please note that the EntityDataModule demands you to also import the ``StoreModule`` and ``EffectModule``. We did this in previous labs.

1. Add a ``passenger-data`` module to your application:

    ```
    ng g module passenger-data
    ```

2. Add a ``PassengerService`` to your passenger module:

    ```typescript
    @Injectable({ providedIn: 'root' })
    export class PassengerService extends EntityCollectionServiceBase<DataPassenger> {
        constructor(serviceElementsFactory: EntityCollectionServiceElementsFactory)
        {
            super('Passenger', serviceElementsFactory);
        }
    }
    ```

3. Add a ``PassengerComponent`` to your passenger module: 
   - Inject your ``PassengerService``:
   - Fetch the passengers from the store using its ``entities$`` property.
   - Provide a ``load`` method which uses the ``PassengerService``'s ``getAll`` method to load all passengers.
   - Provide a ``add`` method which uses the ``PassengerService``'s ``add`` method to add a new passenger.

    <details>
    <summary>Show code</summary>
    <p>

    ```TypeScript
    [...]

    @Component({
        selector: 'app-passenger',
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
    ```

    </p>
    </details>

4. Switch to the ``PassengerComponent``'s template and provide buttons for the methods ``load`` and ``add``. Also, display all the passengers in ``passengers$``.

    <details>
    <summary>Show code</summary>
    <p>

    ```html
    <h2>Passengers (ngrx/data)</h2>

    <pre>
    {{ passengers$ | async | json }}
    </pre>
    <p>
    <button class="btn btn-default" (click)="load()">Load</button>
    <button class="btn btn-default" (click)="add()">Add</button>
    </p>
    ```

    </p>
    </details>

5. Open the file ``passenger-data.module``. Make sure the ``PassengerComponent`` is declared and add a route for it by importing ``RouterModule.forChild``. Please also make sure that the `DefaultDataServiceConfig` is provided with the correct API url (see show code toggle). 

    <details>
    <summary>Show code</summary>
    <p>

    ```TypeScript

    @NgModule({
        imports: [
            CommonModule,
            RouterModule.forChild([
                { 
                    path: 'passenger-data', 
                    component: PassengerComponent 
                }
            ])
        ],
        declarations: [
            PassengerComponent
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
    ```

    </p>
    </details>

6. In your ``app.module.ts``, import the ``PassengerDataModule``:

    ```typescript
    imports: [
        [...],
        PassengerDataModule
    ]
    ```

7.  In your ``sidebar.component.html``, add a link for the ``PassengerComponent``.

    <details>
    <summary>Show code</summary>
    <p>

    ```html

    <li>
        <a routerLink="passenger-data">
            <i class="ti-user"></i>
            <p>Passengers (data)</p>
        </a>
    </li>
    ```

    </p>
    </details>

8.  Start your application and test your new component:
    - Load all passengers.
    - Add a passenger.
    - Have a look into network tab (developer tools) to find out which HTTP requests are created.
    - Have a look into the ReduxDevTools to find out which actions are dispatched.
