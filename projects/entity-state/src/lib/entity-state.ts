import {getActive, HashMap} from './internal';
import {
  EntityAddAction,
  EntityRemoveAction,
  EntitySetActiveAction,
  EntitySetErrorAction,
  EntitySetLoadingAction,
  EntityUpdateAction,
  EntityUpdateActiveAction
} from './actions';
import {StateContext} from '@ngxs/store';
import {Type} from '@angular/core';
import {InvalidIdError, NoActiveEntityError, NoSuchEntityError} from './errors';

/**
 * Interface for an EntityState.
 * Includes the entities in an object literal, the loading and error state and the ID of the active selected entity.
 */
export interface EntityStateModel<T> {
  entities: HashMap<T>;
  loading: boolean;
  error: Error | undefined;
  active: string | undefined;
}

/**
 * Returns a new object which serves as the default state.
 * No entities, loading is false, error is undefined, active is undefined.
 */
export function defaultEntityState(): EntityStateModel<any> {
  return {
    entities: {},
    loading: false,
    error: undefined,
    active: undefined
  };
}

export type StateSelector<T = any> = (state: EntityStateModel<any>) => T;

// @dynamic
export abstract class EntityState<T> {

  private readonly idKey: string;
  private readonly storePath: string;

  protected constructor(storeClass: Type<EntityState<T>>, _idKey: keyof T) {
    this.idKey = _idKey as string;
    this.storePath = storeClass['NGXS_META'].path;
    this.setup(storeClass,
      'add',
      'update', 'updateActive',
      'remove', 'removeActive',
      'setLoading', 'setError',
      'setActive', 'clearActive',
      'reset');
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
    return (state) => {
      const subState = elvis(state, that.staticStorePath) as EntityStateModel<any>;
      return subState.active;
    };
  }

  /**
   * Returns a selector for the active entity
   */
  static get active(): StateSelector {
    const that = this;
    return (state) => {
      const subState = elvis(state, that.staticStorePath) as EntityStateModel<any>;
      return getActive(subState);
    };
  }

  /**
   * Returns a selector for the keys of all entities
   */
  static get keys(): StateSelector<string[]> {
    const that = this;
    return (state) => {
      const subState = elvis(state, that.staticStorePath) as EntityStateModel<any>;
      return Object.keys(subState.entities);
    };
  }

  /**
   * Returns a selector for all entities
   */
  static get entities(): StateSelector<any[]> {
    const that = this;
    return (state) => {
      const subState = elvis(state, that.staticStorePath) as EntityStateModel<any>;
      return Object.values(subState.entities);
    };
  }

  /**
   * Returns a selector for the map of entities
   */
  static get entitiesMap(): StateSelector<HashMap<any>> {
    const that = this;
    return (state) => {
      const subState = elvis(state, that.staticStorePath) as EntityStateModel<any>;
      return subState.entities;
    };
  }

  /**
   * Returns a selector for the size of the entity map
   */
  static get size(): StateSelector<number> {
    const that = this;
    return (state) => {
      const subState = elvis(state, that.staticStorePath) as EntityStateModel<any>;
      return Object.keys(subState.entities).length;
    };
  }

  /**
   * Returns a selector for the error
   */
  static get error(): StateSelector<Error | undefined> {
    const that = this;
    return (state) => {
      const name = that.staticStorePath;
      return elvis(state, name).error;
    };
  }

  /**
   * Returns a selector for the loading state
   */
  static get loading(): StateSelector<boolean> {
    const that = this;
    return (state) => {
      const name = that.staticStorePath;
      return elvis(state, name).loading;
    };
  }

  // ------------------- ACTION HANDLERS -------------------

  add({getState, patchState}: StateContext<EntityStateModel<T>>, {payload}: EntityAddAction<T>) {
    const {entities} = getState();
    if (Array.isArray(payload)) {
      (payload as T[]).forEach(e => entities[this.idOf(e)] = e);
    } else {
      entities[this.idOf(payload)] = payload;
    }

    patchState({entities: {...entities}});
  }

  update({getState, patchState}: StateContext<EntityStateModel<T>>, {payload}: EntityUpdateAction<T>) {
    let entities = {...getState().entities}; // create copy

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

    patchState({entities});
  }

  updateActive({getState, patchState}: StateContext<EntityStateModel<T>>, {payload}: EntityUpdateActiveAction<T>) {
    const state = getState();
    const {id, active} = mustGetActive(state);
    const {entities} = state;

    if (typeof payload === 'function') {
      patchState({entities: {...this._update(entities, payload(active), id)}});
    } else {
      patchState({entities: {...this._update(entities, payload, id)}});
    }
  }

  removeActive({getState, patchState}: StateContext<EntityStateModel<T>>) {
    const {entities, active} = getState();
    delete entities[active];
    patchState({entities: {...entities}, active: undefined});
  }

  remove({getState, patchState}: StateContext<EntityStateModel<T>>, {payload}: EntityRemoveAction<T>) {
    const {entities, active} = getState();

    if (payload === null) {
      patchState({entities: {}, active: undefined});
    } else {
      const deleteIds: string[] = typeof payload === 'function' ?
        Object.values(entities).filter(e => payload(e)).map(e => this.idOf(e)) :
        Array.isArray(payload) ? payload as string[] : [payload] as string[];

      const wasActive = deleteIds.includes(active);
      deleteIds.forEach(id => delete entities[id]);
      patchState({
        entities: {...entities},
        active: wasActive ? undefined : active
      });
    }
  }

  reset({setState}: StateContext<EntityStateModel<T>>) {
    setState(defaultEntityState());
  }

  setLoading({patchState}: StateContext<EntityStateModel<T>>, {payload}: EntitySetLoadingAction) {
    patchState({loading: payload});
  }

  setActive({patchState}: StateContext<EntityStateModel<T>>, {payload}: EntitySetActiveAction) {
    patchState({active: payload});
  }

  clearActive({patchState}: StateContext<EntityStateModel<T>>) {
    patchState({active: undefined});
  }

  setError({patchState}: StateContext<EntityStateModel<T>>, {payload}: EntitySetErrorAction) {
    patchState({error: payload});
  }

  // ------------------- UTILITY -------------------

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

function mustGetActive<T>(state: EntityStateModel<T>): { id: string, active: T} {
  const active = getActive(state);
  if (active === undefined) {
    throw new NoActiveEntityError();
  }
  return { id: state.active, active };
}

function elvis(object: any, path: string) {
  return path ? path.split('.').reduce(function (value, key) {
    return value && value[key];
  }, object) : object;
}
