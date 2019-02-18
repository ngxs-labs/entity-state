import { Type } from '@angular/core';
import { StateContext } from '@ngxs/store';
import {
  EntityActionType,
  EntityAddAction,
  EntityCreateOrReplaceAction,
  EntityGoToPageAction,
  EntityRemoveAction,
  EntitySetActiveAction,
  EntitySetErrorAction,
  EntitySetLoadingAction,
  EntitySetPageSizeAction,
  EntityUpdateAction,
  EntityUpdateActiveAction
} from './actions';
import { InvalidIdError, NoSuchEntityError, UpdateFailedError } from './errors';
import { IdStrategy } from './id-strategy';
import {
  asArray,
  elvis,
  getActive,
  HashMap,
  mustGetActive,
  NGXS_META_KEY,
  wrapOrClamp
} from './internal';
import { EntityStateModel, StateSelector } from './models';
import IdGenerator = IdStrategy.IdGenerator;

/**
 * Returns a new object which serves as the default state.
 * No entities, loading is false, error is undefined, active is undefined.
 * pageSize is 10 and pageIndex is 0.
 */
export function defaultEntityState<T>(
  defaults: Partial<EntityStateModel<T>> = {}
): EntityStateModel<T> {
  return {
    entities: {},
    ids: [],
    loading: false,
    error: undefined,
    active: undefined,
    pageSize: 10,
    pageIndex: 0,
    lastUpdated: Date.now(),
    ...defaults
  };
}

// @dynamic
export abstract class EntityState<T extends {}> {
  private readonly idKey: string;
  private readonly storePath: string;
  protected readonly idGenerator: IdGenerator<T>;

  protected constructor(
    storeClass: Type<EntityState<T>>,
    _idKey: keyof T,
    idStrategy: Type<IdGenerator<T>>
  ) {
    this.idKey = _idKey as string;
    this.storePath = storeClass[NGXS_META_KEY].path;
    this.idGenerator = new idStrategy(_idKey);

    this.setup(storeClass, Object.values(EntityActionType));
  }

  private static get staticStorePath(): string {
    const that = this;
    return that[NGXS_META_KEY].path;
  }

  /**
   * This function is called every time an entity is updated.
   * It receives the current entity and a partial entity that was either passed directly or generated with a function.
   * The default implementation uses the spread operator to create a new entity.
   * You must override this method if your entity type does not support the spread operator.
   * @see Updater
   * @param current The current entity, readonly
   * @param updated The new data as a partial entity
   * @example
   * // default behavior
   * onUpdate(current: Readonly<T updated: Partial<T>): T {
  return {...current, ...updated};
 }
   */
  onUpdate(current: Readonly<T>, updated: Partial<T>): T {
    return { ...current, ...updated } as T;
  }

  // ------------------- SELECTORS -------------------

  /**
   * Returns a selector for the activeId
   */
  static get activeId(): StateSelector<string> {
    const that = this;
    return state => {
      const subState = elvis(state, that.staticStorePath) as EntityStateModel<any>;
      return subState.active;
    };
  }

  /**
   * Returns a selector for the active entity
   */
  static get active(): StateSelector<any> {
    const that = this;
    return state => {
      const subState = elvis(state, that.staticStorePath) as EntityStateModel<any>;
      return getActive(subState);
    };
  }

  /**
   * Returns a selector for the keys of all entities
   */
  static get keys(): StateSelector<string[]> {
    const that = this;
    return state => {
      const subState = elvis(state, that.staticStorePath) as EntityStateModel<any>;
      return Object.keys(subState.entities);
    };
  }

  /**
   * Returns a selector for all entities, sorted by insertion order
   */
  static get entities(): StateSelector<any[]> {
    const that = this;
    return state => {
      const subState = elvis(state, that.staticStorePath) as EntityStateModel<any>;
      return subState.ids.map(id => subState.entities[id]);
    };
  }

  /**
   * Returns a selector for the nth entity, sorted by insertion order
   */
  static nthEntity(index: number): StateSelector<any> {
    // tslint:disable-line:member-ordering
    const that = this;
    return state => {
      const subState = elvis(state, that.staticStorePath) as EntityStateModel<any>;
      const id = subState.ids[index];
      return subState.entities[id];
    };
  }

  /**
   * Returns a selector for paginated entities, sorted by insertion order
   */
  static get paginatedEntities(): StateSelector<any[]> {
    // tslint:disable-line:member-ordering
    const that = this;
    return state => {
      const subState = elvis(state, that.staticStorePath) as EntityStateModel<any>;
      const { ids, pageIndex, pageSize } = subState;
      return ids
        .slice(pageIndex * pageSize, (pageIndex + 1) * pageSize)
        .map(id => subState.entities[id]);
    };
  }

  /**
   * Returns a selector for the map of entities
   */
  static get entitiesMap(): StateSelector<HashMap<any>> {
    const that = this;
    return state => {
      const subState = elvis(state, that.staticStorePath) as EntityStateModel<any>;
      return subState.entities;
    };
  }

  /**
   * Returns a selector for the size of the entity map
   */
  static get size(): StateSelector<number> {
    const that = this;
    return state => {
      const subState = elvis(state, that.staticStorePath) as EntityStateModel<any>;
      return Object.keys(subState.entities).length;
    };
  }

  /**
   * Returns a selector for the error
   */
  static get error(): StateSelector<Error | undefined> {
    const that = this;
    return state => {
      const name = that.staticStorePath;
      return elvis(state, name).error;
    };
  }

  /**
   * Returns a selector for the loading state
   */
  static get loading(): StateSelector<boolean> {
    const that = this;
    return state => {
      const name = that.staticStorePath;
      return elvis(state, name).loading;
    };
  }

  /**
   * Returns a selector for the latest added entity
   */
  static get latest(): StateSelector<any> {
    const that = this;
    return state => {
      const subState = elvis(state, that.staticStorePath) as EntityStateModel<any>;
      const latestId = subState.ids[subState.ids.length - 1];
      return subState.entities[latestId];
    };
  }

  /**
   * Returns a selector for the latest added entity id
   */
  static get latestId(): StateSelector<string | undefined> {
    const that = this;
    return state => {
      const subState = elvis(state, that.staticStorePath) as EntityStateModel<any>;
      return subState.ids[subState.ids.length - 1];
    };
  }

  /**
   * Returns a selector for the update timestamp
   */
  static get lastUpdated(): StateSelector<Date> {
    // tslint:disable-line:member-ordering
    const that = this;
    return state => {
      const subState = elvis(state, that.staticStorePath) as EntityStateModel<any>;
      return new Date(subState.lastUpdated);
    };
  }

  /**
   * Returns a selector for age, based on the update timestamp
   */
  static get age(): StateSelector<number> {
    // tslint:disable-line:member-ordering
    const that = this;
    return state => {
      const subState = elvis(state, that.staticStorePath) as EntityStateModel<any>;
      return Date.now() - subState.lastUpdated;
    };
  }

  // ------------------- ACTION HANDLERS -------------------

  /**
   * The entities given by the payload will be added.
   * For certain ID strategies this might fail, if it provides an existing ID.
   * In all cases it will overwrite the ID value in the entity with the calculated ID.
   */
  add(
    { getState, patchState }: StateContext<EntityStateModel<T>>,
    { payload }: EntityAddAction<T>
  ) {
    const updated = this._addOrReplace(
      getState(),
      payload,
      // for automated ID strategies this mostly shouldn't throw an UnableToGenerateIdError error
      // for EntityIdGenerator it will throw an error if no ID is present
      (p, state) => this.idGenerator.generateId(p, state)
    );
    patchState({ ...updated, lastUpdated: Date.now() });
  }

  /**
   * The entities given by the payload will be added.
   * It first checks if the ID provided by each entity does exist.
   * If it does the current entity will be replaced.
   * In all cases it will overwrite the ID value in the entity with the calculated ID.
   */
  createOrReplace(
    { getState, patchState }: StateContext<EntityStateModel<T>>,
    { payload }: EntityCreateOrReplaceAction<T>
  ) {
    const updated = this._addOrReplace(getState(), payload, (p, state) =>
      this.idGenerator.getPresentIdOrGenerate(p, state)
    );
    patchState({ ...updated, lastUpdated: Date.now() });
  }

  update(
    { getState, patchState }: StateContext<EntityStateModel<T>>,
    { payload }: EntityUpdateAction<T>
  ) {
    let entities = { ...getState().entities }; // create copy

    let affected: T[];

    if (payload.id === null) {
      affected = Object.values(entities);
    } else if (typeof payload.id === 'function') {
      affected = Object.values(entities).filter(e => (<Function>payload.id)(e));
    } else {
      const ids = asArray(payload.id);
      affected = Object.values(entities).filter(e => ids.includes(this.idOf(e)));
    }

    if (typeof payload.data === 'function') {
      affected.forEach(e => {
        entities = this._update(entities, (<Function>payload.data)(e), this.idOf(e));
      });
    } else {
      affected.forEach(e => {
        entities = this._update(entities, payload.data as Partial<T>, this.idOf(e));
      });
    }

    patchState({ entities, lastUpdated: Date.now() });
  }

  updateActive(
    { getState, patchState }: StateContext<EntityStateModel<T>>,
    { payload }: EntityUpdateActiveAction<T>
  ) {
    const state = getState();
    const { id, active } = mustGetActive(state);
    const { entities } = state;

    if (typeof payload === 'function') {
      patchState({
        entities: { ...this._update(entities, payload(active), id) },
        lastUpdated: Date.now()
      });
    } else {
      patchState({
        entities: { ...this._update(entities, payload, id) },
        lastUpdated: Date.now()
      });
    }
  }

  removeActive({ getState, patchState }: StateContext<EntityStateModel<T>>) {
    const { entities, ids, active } = getState();
    delete entities[active];
    patchState({
      entities: { ...entities },
      ids: ids.filter(id => id !== active),
      active: undefined,
      lastUpdated: Date.now()
    });
  }

  remove(
    { getState, patchState }: StateContext<EntityStateModel<T>>,
    { payload }: EntityRemoveAction<T>
  ) {
    const { entities, ids, active } = getState();

    if (payload === null) {
      patchState({
        entities: {},
        ids: [],
        active: undefined,
        lastUpdated: Date.now()
      });
    } else {
      const deleteIds: string[] =
        typeof payload === 'function'
          ? Object.values(entities)
              .filter(e => payload(e))
              .map(e => this.idOf(e))
          : asArray(payload);

      const wasActive = deleteIds.includes(active);
      deleteIds.forEach(id => delete entities[id]);
      patchState({
        entities: { ...entities },
        ids: ids.filter(id => !deleteIds.includes(id)),
        active: wasActive ? undefined : active,
        lastUpdated: Date.now()
      });
    }
  }

  reset({ setState }: StateContext<EntityStateModel<T>>) {
    setState(defaultEntityState());
  }

  setLoading(
    { patchState }: StateContext<EntityStateModel<T>>,
    { payload }: EntitySetLoadingAction
  ) {
    patchState({ loading: payload });
  }

  setActive(
    { patchState }: StateContext<EntityStateModel<T>>,
    { payload }: EntitySetActiveAction
  ) {
    patchState({ active: payload });
  }

  clearActive({ patchState }: StateContext<EntityStateModel<T>>) {
    patchState({ active: undefined });
  }

  setError(
    { patchState }: StateContext<EntityStateModel<T>>,
    { payload }: EntitySetErrorAction
  ) {
    patchState({ error: payload });
  }

  goToPage(
    { getState, patchState }: StateContext<EntityStateModel<T>>,
    { payload }: EntityGoToPageAction
  ) {
    if ('page' in payload) {
      patchState({ pageIndex: payload.page });
      return;
    } else if (payload['first']) {
      patchState({ pageIndex: 0 });
      return;
    }

    const { pageSize, pageIndex, ids } = getState();
    const totalSize = ids.length;
    const maxIndex = Math.floor(totalSize / pageSize);

    if ('last' in payload) {
      patchState({ pageIndex: maxIndex });
    } else {
      const step = payload['prev'] ? -1 : 1;
      let index = pageIndex + step;
      index = wrapOrClamp(payload.wrap, index, 0, maxIndex);
      patchState({ pageIndex: index });
    }
  }

  setPageSize(
    { patchState }: StateContext<EntityStateModel<T>>,
    { payload }: EntitySetPageSizeAction
  ) {
    patchState({ pageSize: payload });
  }

  // ------------------- UTILITY -------------------

  /**
   * A utility function to update the given state with the given entities.
   * It returns a state model with the new entities map and IDs.
   * For each given entity an ID will be generated. The generated ID will overwrite the current value:
   * <code>entity[this.idKey] = generatedId(entity, state);</code>
   * If the ID wasn't present, it will be added to the state's IDs array.
   * @param state The current state to act on
   * @param payload One or multiple partial entities
   * @param generateId A function to generate an ID for each given entity
   */
  private _addOrReplace(
    state: EntityStateModel<T>,
    payload: T | T[],
    generateId: (payload: Partial<T>, state: EntityStateModel<T>) => string
  ): { entities: HashMap<T>; ids: string[] } {
    const { entities, ids } = state;
    asArray(payload).forEach(entity => {
      const id = generateId(entity, state);
      entity[this.idKey] = id;
      entities[id] = entity;
      if (!ids.includes(id)) {
        ids.push(id);
      }
    });

    return {
      entities: { ...entities },
      ids: [...ids]
    };
  }

  /**
   * A utility function to update the given entities map with the provided partial entity.
   * After checking if an entity with the given ID is present, the #onUpdate method is called.
   * @param entities The current entity map
   * @param entity The partial entity to update with
   * @param id The ID to find the current entity in the map
   */
  private _update(
    entities: HashMap<T>,
    entity: Partial<T>,
    id: string = this.idOf(entity)
  ): HashMap<T> {
    if (id === undefined) {
      throw new UpdateFailedError(new InvalidIdError(id));
    }
    const current = entities[id];
    if (current === undefined) {
      throw new UpdateFailedError(new NoSuchEntityError(id));
    }
    entities[id] = this.onUpdate(current, entity);
    return entities;
  }

  private setup(storeClass: Type<EntityState<T>>, actions: string[]) {
    // validation if a matching action handler exists has moved to reflection-validation tests
    actions.forEach(fn => {
      const actionName = `[${this.storePath}] ${fn}`;
      storeClass[NGXS_META_KEY].actions[actionName] = [
        {
          fn: fn,
          options: {},
          type: actionName
        }
      ];
    });
  }

  /**
   * Returns the id of the given entity, based on the defined idKey.
   * This methods allows Partial entities and thus might return undefined.
   * Other methods calling this one have to handle this case themselves.
   * @param data a partial entity
   */
  protected idOf(data: Partial<T>): string | undefined {
    return data[this.idKey];
  }
}
