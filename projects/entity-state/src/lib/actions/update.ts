import {generateActionObject} from '../internal';
import {EntitySelector, Updater} from './type-alias';
import {ExtendsEntityStore} from '../entity-store';


export interface EntityUpdateAction<T> {
  payload: {
    id: EntitySelector<T>; // string | string[] | ((entity: T) => boolean) | undefined;
    data: Updater<T>; // Partial<T> | ((entity: T) => Partial<T>);
  };
}

export function Update<T>(store: ExtendsEntityStore<T>,
                          id: EntitySelector<T>, // string | string[] | ((entity: T) => boolean) | undefined,
                          data: Updater<T>): EntityUpdateAction<T> {
  return generateActionObject('update', store, {id, data});
}
