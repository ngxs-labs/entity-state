import { generateActionObject } from '../internal';
import { EntityActionType, EntitySelector, Payload } from './type-alias';
import { EntityState } from '../entity-state';
import { Type } from '@angular/core';

export type EntityRemoveAction<T> = Payload<EntitySelector<T>>;

export class Remove<T> {
  /**
   * Generates an action that will remove the given entities from the state.
   * @param target The targeted state class
   * @param payload An EntitySelector payload
   * @see EntitySelector
   * @see RemoveAll
   */
  constructor(target: Type<EntityState<T>>, payload: EntitySelector<T>) {
    return generateActionObject(EntityActionType.Remove, target, payload);
  }
}

export class RemoveAll {
  /**
   * Generates an action that will remove all entities from the state.
   * @param target The targeted state class
   */
  constructor(target: Type<EntityState<any>>) {
    return generateActionObject(EntityActionType.RemoveAll, target);
  }
}
