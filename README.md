<p align="center">
    <img src="https://raw.githubusercontent.com/ngxs-labs/emitter/master/docs/assets/logo.png">
</p>

---

> Easy CRUD actions for your `ngxs` state

[![Build Status](https://travis-ci.org/ngxs-labs/entity-state.svg?branch=master)](https://travis-ci.org/ngxs-labs/entity-state)
[![NPM](https://badge.fury.io/js/%40ngxs-labs%2Fentity-state.svg)](https://www.npmjs.com/package/@ngxs-labs/entity-state)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://github.com/ngxs-labs/entity-state/blob/master/LICENSE)

This package is an entity adapter and simplifies CRUD behaviour with just a few lines of setup per state class!

### Setup

```bash
npm i @ngxs-labs/entity-state
```

You do not have import any module, just extend your state class, make a `super` call and you are good to go!
The first `super` parameter is always the state class itself.
The second parameter is the key to identify your entities with.
The third is an implementation of an `IdGenerator` (see [below](#IdStrategy)).

#### Example state

```typescript
export interface ToDo {
  title: string;
  description: string;
  done: boolean;
}

@State<EntityStateModel<ToDo>>({
  name: 'todo',
  defaults: defaultEntityState()
})
export class TodoState extends EntityState<ToDo> {
  constructor() {
    super(TodoState, 'title', IdStrategy.EntityIdGenerator);
  }
}
```

>[Example in the integration app](https://github.com/ngxs-labs/entity-state/blob/master/integration/app/store/todo/store.ts#L19)!


### Actions

There are ready to use Actions for entity-states. Just pass in the targeted state class as the first parameter and then your action's payload.

```typescript
this.store.dispatch(new SetLoading(TodoState, this.loading));
this.store.dispatch(new UpdateActive(TodoState, { done: true }));
```

>[Example in the integration app](https://github.com/ngxs-labs/entity-state/blob/master/integration/app/app.component.ts#L46)

| Action | Short description |
|---|---|
| `Add` | Adds a new entity and cannot replace existing entities |
| `CreateOrReplace` | Gets the entity's ID and will replace entities with same id or else add a new one |
| `Update` | Updates [one or more](#EntitySelector) entities by partial value or function |
| `Remove` | Removes entities from the state |
| ---------- | ---------- |
| `SetActive` | Takes an ID and sets it as active |
| `ClearActive` | Clears the active ID |
| `UpdateActive` | Updates the currently active entity |
| `RemoveActive` | Removes the active entity and clears the ID |
| ---------- | ---------- |
| `SetError` | Sets the error (`Error` instance or `undefined`)|
| `SetLoading` | Sets the loading state (`true` or `false`) |
| `Reset` | Resets the state to default |
| ---------- | ---------- |
| `GoToPage` | Goes to specified page, via index, stepwise or first/last |
| `SetPageSize` | Sets the page size |

Actions that change the entities will update the internal timestamp `lastUpdated`.
You can use one of the existing selectors to see the age of your data.

### Selectors

Use predefined Selectors just like you would normally!

```typescript
@Select(TodoState.entities) toDos$: Observable<ToDo[]>;
@Select(TodoState.active) active$: Observable<ToDo>;
```

>[Example in the integration app](https://github.com/ngxs-labs/entity-state/blob/master/integration/app/app.component.ts#L28)

| Selector | Short description |
|---|---|
| `entities` | All entities in an array |
| `keys` | All entity keys in an array |
| `entitiesMap` | All entities in a map |
| `size` | Entity count |
| `active ` | the active entity |
| `activeId` | the active ID |
| `paginatedEntities` | Entities in an array defined by pagination values |
| `nthEntity` | the nthEntity by insertion order |
| `latestId` | the ID of the latest entity |
| `latest` | the latest entity |
| `loading` | the loading state |
| `error` | the current error |
| `lastUpdated` | the `lastUpdated` timestamp as `Date` |
| `age` | difference between `Date.now()` and `lastUpdated` in ms |

### `IdStrategy`

There are 3 different strategies in the `IdStrategy` namespace available:

- `IncrementingIdGenerator` -> uses auto-incremeting IDs based on present entities
- `UUIDGenerator` -> generates `UUID` for new entities
- `EntityIdGenerator` -> takes the id from the provided entity

The latter will cause errors if you try to `add` an entity with the same ID.
The former two can always generate a new ID.

You can also implement your own strategy by extending `IdGenerator`.

### `EntitySelector`

The `EntitySelector` type is used in Actions such as `Update` or `Remove`.
```typescript
export type EntitySelector<T> = string | string[] | ((T) => boolean) | null;
```

- `string` -> one ID, selects one entity
- `string[]` -> array of IDs, selects matching entities
- `((T) => boolean)` -> predicate, selects entities that return true for this predicate
- `null` -> all entities in the state
