import {generateActionObject} from '../internal';
import {Payload} from './type-alias';
import {ExtendsEntityStore} from '../entity-store';

/*export interface EntityAddAction<T> {
  payload: T | T[];
}*/
export type EntityAddAction<T> = Payload<T | T[]>;

// TODO: behaviour? Should add also replace if it exists? Separate CreateOrReplace?
export function AddOrReplace<T>(store: ExtendsEntityStore<T>, payload: T | T[]): EntityAddAction<T> {
  return generateActionObject('add', store, payload);
}
