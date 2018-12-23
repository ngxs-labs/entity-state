import { Type } from '@angular/core';
import { StateContext } from '@ngxs/store';
import {
  EntityAddAction,
  EntityCreateOrReplaceAction,
  EntityRemoveAction,
  EntitySetActiveAction,
  EntitySetErrorAction,
  EntitySetLoadingAction,
  EntityUpdateAction,
  EntityUpdateActiveAction
} from './actions';
import { InvalidIdError, NoActiveEntityError, NoSuchEntityError } from './errors';
import { IdStrategy } from './id-strategy';
import { getActive, HashMap } from './internal';
import IdGenerator = IdStrategy.IdGenerator;

/**
 * Interface for an EntityState.
 * Includes the entities in an object literal, the loading and error state and the ID of the active selected entity.
 */
export interface EntityStateModel<T> {
  entities: HashMap<T>;
  loading: boolean;
  error: Error | undefined;
  active: string | undefined;
  ids: string[];
}

/**
 * Returns a new object which serves as the default state.
 * No entities, loading is false, error is undefined, active is undefined.
 */
export function defaultEntityState(): EntityStateModel<any> {
  return {
    entities: {},
    ids: [],
    loading: false,
    error: undefined,
    active: undefined
  };
}

export type StateSelector<T> = (state: EntityStateModel<any>) => T;

// @dynamic
export abstract class EntityState<T> {
  private readonly idKey: string;
  private readonly storePath: string;
  protected readonly idGenerator: IdGenerator<T>;

  protected constructor(
    storeClass: Type<EntityState<T>>,
    _idKey: keyof T,
    idStrategy: Type<IdGenerator<T>>
  ) {
    this.idKey = _idKey as string;
    this.storePath = storeClass['NGXS_META'].path;
    this.idGenerator = new idStrategy(_idKey);

    this.setup(
      storeClass,
      'add',
      'createOrReplace',
      'update',
      'updateActive',
      'remove',
      'removeActive',
      'setLoading',
      'setError',
      'setActive',
      'clearActive',
      'reset'
    );
  }

  private static get staticStorePath(): string {
    const that = this;
    return that['NGXS_META'].path;
  }

  /**
   * This function is called every time an entity is updated.
   * It receives the current entity and a partial entity that was either passed directly or generated with a function
   * @see Updater
   * @param current The current entity, readonly
   * @param updated The new data as a partial entity
   * @example
   *onUpdate(current: ToDo, updated: Partial<ToDo>): ToDo {
  return {...current, ...updated};
}
   */
  abstract onUpdate(current: Readonly<T>, updated: Partial<T>): T;

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
  static paginatedEntities(size: number, page: number): StateSelector<any[]> {
    // tslint:disable-line:member-ordering
    const that = this;
    return state => {
      const subState = elvis(state, that.staticStorePath) as EntityStateModel<any>;
      return subState.ids
        .slice(page * size, (page + 1) * size)
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

  // ------------------- ACTION HANDLERS -------------------

  // a new entity (unless there was an error) will be added
  // if the entity provides an existing ID, an error will be thrown
  // In all cases it will do entity[idKey] = id;
  add(
    { getState, patchState }: StateContext<EntityStateModel<T>>,
    { payload }: EntityAddAction<T>
  ) {
    const updated = this._upsert(
      getState(),
      payload,
      // for automated ID strategies this won't throw an error
      // for IdStrategy.FROM_ENTITY it will throw an error if no ID is present
      (p, state) => this.idGenerator.generateId(p, state)
    );
    patchState({ ...updated });
  }

  // TODO: payload type, add actions
  // if a valid ID is present or can be generated it will use that and create/replace without error
  createOrReplace(
    { getState, patchState }: StateContext<EntityStateModel<T>>,
    { payload }: EntityCreateOrReplaceAction<T>
  ) {
    const updated = this._upsert(getState(), payload, (p, state) =>
      this.idGenerator.getPresentIdOrGenerate(p, state)
    );
    patchState({ ...updated });
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
      const ids = Array.isArray(payload.id) ? payload.id : [payload.id];
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

    patchState({ entities });
  }

  updateActive(
    { getState, patchState }: StateContext<EntityStateModel<T>>,
    { payload }: EntityUpdateActiveAction<T>
  ) {
    const state = getState();
    const { id, active } = mustGetActive(state);
    const { entities } = state;

    if (typeof payload === 'function') {
      patchState({ entities: { ...this._update(entities, payload(active), id) } });
    } else {
      patchState({ entities: { ...this._update(entities, payload, id) } });
    }
  }

  removeActive({ getState, patchState }: StateContext<EntityStateModel<T>>) {
    const { entities, ids, active } = getState();
    delete entities[active];
    patchState({
      entities: { ...entities },
      ids: ids.filter(id => id !== active),
      active: undefined
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
        active: undefined
      });
    } else {
      const deleteIds: string[] =
        typeof payload === 'function'
          ? Object.values(entities)
              .filter(e => payload(e))
              .map(e => this.idOf(e))
          : Array.isArray(payload)
          ? (payload as string[])
          : ([payload] as string[]);

      const wasActive = deleteIds.includes(active);
      deleteIds.forEach(id => delete entities[id]);
      patchState({
        entities: { ...entities },
        ids: ids.filter(id => !deleteIds.includes(id)),
        active: wasActive ? undefined : active
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

  // ------------------- UTILITY -------------------

  private _upsert(
    state: EntityStateModel<T>,
    payload: Partial<T> | Partial<T>[],
    generateId: (payload: Partial<T>, state: EntityStateModel<T>) => string
  ): Partial<EntityStateModel<T>> {
    const { entities, ids } = state;
    asArray(payload).forEach(entity => {
      const id = generateId(entity, state);
      entity[this.idKey] = id;
      entities[id] = entity as T; // TODO: check implementation if partial or not is needed
      if (!ids.includes(id)) {
        ids.push(id);
      }
    });

    return {
      entities: { ...entities },
      ids: [...ids]
    };
  }

  private _update(entities: HashMap<T>, entity: Partial<T>, _id?: string): HashMap<T> {
    const id = _id || this.idOf(entity);
    if (id === undefined) {
      throw new InvalidIdError(_id, this.idOf(entity));
    }
    const current = entities[id];
    if (current === undefined) {
      throw new NoSuchEntityError(`ID: ${id}`);
    }
    entities[id] = this.onUpdate(current, entity);
    return entities;
  }

  private setup(storeClass: Type<EntityState<T>>, ...actions: string[]) {
    actions.forEach(fn => {
      const actionName = `[${this.storePath}] ${fn}`;
      storeClass['NGXS_META'].actions[actionName] = [
        {
          fn: fn,
          options: {},
          type: actionName
        }
      ];
    });
  }

  protected idOf(data: Partial<T>): string {
    // TODO: assertValidId here every time?
    return data[this.idKey];
  }
}

function mustGetActive<T>(state: EntityStateModel<T>): { id: string; active: T } {
  const active = getActive(state);
  if (active === undefined) {
    throw new NoActiveEntityError();
  }
  return { id: state.active, active };
}

function elvis(object: any, path: string) {
  return path
    ? path.split('.').reduce(function(value, key) {
        return value && value[key];
      }, object)
    : object;
}

function asArray<T>(input: T | T[]): T[] {
  return Array.isArray(input) ? input : [input];
}
