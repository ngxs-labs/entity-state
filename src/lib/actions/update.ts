import { generateActionObject } from '../internal';
import { EntityActionType, EntitySelector, Updater } from './type-alias';
import { EntityState } from '../entity-state';
import { Type } from '@angular/core';

export interface EntityUpdate<T> {
  selector: EntitySelector<T>;
  data: Updater<T>;
}

export interface EntityUpdateAction<T> {
  payload: EntityUpdate<T>;
}

export class Update<T> {
  /**
   * Generates an action that will update the current active entity.
   * If no entity is active a runtime error will be thrown.
   * @param target The targeted state class
   * @param selector An EntitySelector that determines the entities to update
   * @param data An Updater that will be applied to the selected entities
   * @see EntitySelector
   * @see Updater
   */
  constructor(target: Type<EntityState<T>>, selector: EntitySelector<T>, data: Updater<T>) {
    return generateActionObject(EntityActionType.Update, target, {
      selector,
      data
    } as EntityUpdate<T>);
  }
}
