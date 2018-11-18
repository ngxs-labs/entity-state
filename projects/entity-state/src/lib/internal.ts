import {EntityStateModel, ExtendsEntityStore} from './entity-store';

/*export interface ExtendsEntityStore<T> {
  new(...args: any[]): EntityStore<T>;
}*/

export interface Newable<T, P = any[]> {
  new(args?: P): T;
}

export interface HashMap<T> {
  [id: string]: T;
}

export function generateActionObject<T>(fn: string, store: ExtendsEntityStore<T>, payload?: any) {
  const name = store["NGXS_META"].path;
  const ReflectedAction = function (data: T) {
    this.payload = data;
  };
  const obj = new ReflectedAction(payload);
  obj.__proto__.constructor.type = `[${name}] ${fn}`;
  return obj;
}

export function getActive<T>(state: EntityStateModel<T>): T {
  return state.entities[state.active];
}
