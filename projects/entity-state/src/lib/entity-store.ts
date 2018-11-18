import {getActive, HashMap, Newable} from './internal';
import {
  EntityAddAction,
  EntityRemoveAction,
  EntitySelector,
  EntitySetActiveAction,
  EntitySetErrorAction,
  EntitySetLoadingAction,
  EntityUpdateAction,
  EntityUpdateActiveAction
} from './actions';
import {StateContext} from '@ngxs/store';

export interface EntityStateModel<T> {
  entities: HashMap<T>;
  loading: boolean;
  error: Error | undefined;
  active: string | undefined;
}

export function defaultEntityState(): EntityStateModel<any> {
  return {
    entities: {},
    loading: false,
    error: undefined,
    active: undefined
  };
}

export type ExtendsEntityStore<T> = Newable<EntityStore<T>>;

// @dynamic
export abstract class EntityStore<T> {
  protected readonly idKey: string;
  protected readonly storePath: string;

  protected constructor(storeClass: ExtendsEntityStore<T>, _idKey: keyof T) {
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

  static get staticStorePath(): string {
    const that = this;
    return that['NGXS_META'].path;
  }

  abstract onUpdate(current: T, updated: Partial<T>): T;


  // ------------------- SELECTORS -------------------

  static get activeId() {
    const that = this;
    return (state) => {
      const subState = elvis(state, that.staticStorePath) as EntityStateModel<any>;
      return subState.active;
    };
  }

  static get active() {
    const that = this;
    return (state) => {
      const subState = elvis(state, that.staticStorePath) as EntityStateModel<any>;
      return getActive(subState);
    };
  }

  static get keys() {
    const that = this;
    return (state) => {
      const subState = elvis(state, that.staticStorePath) as EntityStateModel<any>;
      return Object.keys(subState.entities);
    };
  }

  static get entities() {
    const that = this;
    return (state) => {
      const subState = elvis(state, that.staticStorePath) as EntityStateModel<any>;
      return Object.values(subState.entities);
    };
  }

  static get entitiesMap() {
    const that = this;
    return (state) => {
      const subState = elvis(state, that.staticStorePath) as EntityStateModel<any>;
      return subState.entities;
    };
  }

  static get size() {
    const that = this;
    return (state) => {
      const subState = elvis(state, that.staticStorePath) as EntityStateModel<any>;
      return Object.keys(subState.entities).length;
    };
  }

  static get error() {
    const that = this;
    return (state) => {
      const name = that.staticStorePath;
      return elvis(state, name).error;
    };
  }

  static get loading() {
    const that = this;
    return (state) => {
      const name = that.staticStorePath;
      return elvis(state, name).loading;
    };
  }

  // Example implemenation of static action getters to allow the following syntax
  // --> this.store.dispatch(new TodoState.remove(e => e.done));
  // !!!!!!!!!!!!!!
  // As you can see as these are static you can't access <T> and lose every type information
  static get remove(): Newable<any, EntitySelector<any>> {
    const name = this['NGXS_META'].path;
    const ReflectedAction = function (data: EntitySelector<any>) {
      this.payload = data;
    };
    ReflectedAction.prototype.constructor.type = `[${name}] remove`;
    return ReflectedAction as any;
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
    let {entities} = getState();

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
        entities = {...this._update(entities, (<Function>payload.data)(e), this.idOf(e))};
      });
    } else {
      affected.forEach(e => {
        entities = {...this._update(entities, payload.data as Partial<T>, this.idOf(e))};
      });
    }

    patchState({entities});
  }

  updateActive({getState, patchState}: StateContext<EntityStateModel<T>>, {payload}: EntityUpdateActiveAction<T>) {
    const state = getState();
    const active = getActive(state);
    const id = this.idOf(active);
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
    assertValidId(id);
    const current = entities[id];
    // TODO: enforce Immutable Entities ?
    // typeof current === "object" && current !== updated
    entities[id] = this.onUpdate(current, entity);
    return entities;
  }

  // TODO: private?
  protected setup(storeClass: ExtendsEntityStore<T>, ...actions: string[]) {
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

function assertValidId(id: string) {
  if (id === undefined) {
    throw new Error('Invalid ID for update action. Result of getID wasn\'t a valid ID.');
  }
}

function elvis(object: any, path: string) {
  return path ? path.split('.').reduce(function (value, key) {
    return value && value[key];
  }, object) : object;
}
