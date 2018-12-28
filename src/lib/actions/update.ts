import { generateActionObject } from '../internal';
import { EntitySelector, Updater } from './type-alias';
import { EntityState } from '../entity-state';
import { Type } from '@angular/core';

export interface EntityUpdateAction<T> {
  payload: {
    id: EntitySelector<T>;
    data: Updater<T>;
  };
}

export class Update<T> {
  /**
   * Generates an action that will update the current active entity.
   * If no entity is active a runtime error will be thrown.
   * @param target The targeted state class
   * @param id An EntitySelector that determines the entities to update
   * @param data An Updater that will be applied to the selected entities
   * @see EntitySelector
   * @see Updater
   */
  constructor(target: Type<EntityState<T>>, id: EntitySelector<T>, data: Updater<T>) {
    return generateActionObject('update', target, { id, data });
  }
}
