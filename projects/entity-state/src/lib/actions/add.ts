import { generateActionObject } from '../internal';
import { Payload } from './type-alias';
import { EntityState } from '../entity-state';
import { Type } from '@angular/core';

export type EntityAddAction<T> = Payload<T | T[]>;

// TODO: behaviour? Should add also replace if it exists? Separate CreateOrReplace?
export class Add<T> {
  /**
   * Generates an action that will add the given entities to the state.
   * If an entity with the ID already exists, it will be overridden.
   * @param target The targeted state class
   * @param payload An entity or an array of entities to be added
   */
  constructor(target: Type<EntityState<T>>, payload: T | T[]) {
    return generateActionObject('add', target, payload);
  }
}
