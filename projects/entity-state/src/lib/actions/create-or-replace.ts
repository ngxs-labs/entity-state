import {Type} from '@angular/core';
import {EntityState} from '../entity-state';
import {generateActionObject} from '../internal';
import {Payload} from './type-alias';

export type EntityCreateOrReplaceAction<T> = Payload<T | T[]>;

// TODO: behaviour? Should add also replace if it exists? Separate CreateOrReplace?
export class CreateOrReplace<T> {
  /**
   * Generates an action that will add the given entities to the state.
   * If an entity with the ID already exists, it will be overridden.
   * @param target The targeted state class
   * @param payload An entity or an array of entities to be added
   */
  constructor(target: Type<EntityState<T>>, payload: T | T[]) {
    return generateActionObject('createOrReplace', target, payload);
  }
}
