import { generateActionObject } from '../internal';
import { EntityActionType, Payload } from './type-alias';
import { EntityState } from '../entity-state';
import { Type } from '@angular/core';

export type EntityAddAction<T> = Payload<T | T[]>;

export class Add<T> {
  /**
   * Generates an action that will add the given entities to the state.
   * The entities given by the payload will be added.
   * For certain ID strategies this might fail, if it provides an existing ID.
   * In all other cases it will overwrite the ID value in the entity with the calculated ID.
   * @param target The targeted state class
   * @param payload An entity or an array of entities to be added
   * @see CreateOrReplace#constructor
   */
  constructor(target: Type<EntityState<T>>, payload: T | T[]) {
    return generateActionObject(EntityActionType.Add, target, payload);
  }
}
