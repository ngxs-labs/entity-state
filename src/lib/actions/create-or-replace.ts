import { Type } from '@angular/core';
import { EntityState } from '../entity-state';
import { generateActionObject } from '../internal';
import { EntityActionType, Payload } from './type-alias';

export type EntityCreateOrReplaceAction<T> = Payload<T | T[]>;

export class CreateOrReplace<T> {
  /**
   * Generates an action that will add the given entities to the state.
   * If an entity with the ID already exists, it will be overridden.
   * In all cases it will overwrite the ID value in the entity with the calculated ID.
   * @param target The targeted state class
   * @param payload An entity or an array of entities to be added
   * @see Add#constructor
   */
  constructor(target: Type<EntityState<T>>, payload: T | T[]) {
    return generateActionObject(EntityActionType.CreateOrReplace, target, payload);
  }
}
