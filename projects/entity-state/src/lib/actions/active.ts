import {generateActionObject} from '../internal';
import {Payload, Updater} from './type-alias';
import {ExtendsEntityStore} from '../entity-store';

/*export interface EntitySetActiveAction {
  payload: string;
}

export interface EntityUpdateActiveAction<T> {
  payload: Partial<T> | ((entity: T) => Partial<T>);
}*/

export type EntitySetActiveAction = Payload<string>;
export type EntityUpdateActiveAction<T> = Payload<Updater<T>>;

export function SetActive(store: ExtendsEntityStore<any>, id: string): EntitySetActiveAction {
  return generateActionObject('setActive', store, id);
}

export function ClearActive(store: ExtendsEntityStore<any>): {} {
  return generateActionObject('clearActive', store);
}

export function RemoveActive(store: ExtendsEntityStore<any>): {} {
  return generateActionObject('removeActive', store);
}

export function UpdateActive<T>(store: ExtendsEntityStore<T>,
                                payload: Updater<T>): EntityUpdateActiveAction<T> {
  return generateActionObject('updateActive', store, payload);
}
