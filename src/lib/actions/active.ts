import { generateActionObject } from '../internal';
import { EntityActionType, Payload, Updater } from './type-alias';
import { EntityState } from '../entity-state';
import { Type } from '@angular/core';

export type EntitySetActiveAction = Payload<string>;
export type EntityUpdateActiveAction<T> = Payload<Updater<T>>;

export class SetActive {
  /**
   * Generates an action that sets an ID that identifies the active entity
   * @param target The targeted state class
   * @param id The ID that identifies the active entity
   */
  constructor(target: Type<EntityState<any>>, id: string) {
    return generateActionObject(EntityActionType.SetActive, target, id);
  }
}

export class ClearActive {
  /**
   * Generates an action that clears the active entity in the given state
   * @param target The targeted state class
   */
  constructor(target: Type<EntityState<any>>) {
    return generateActionObject(EntityActionType.ClearActive, target);
  }
}

export class RemoveActive {
  /**
   * Generates an action that removes the active entity from the state and clears the active ID.
   * @param target The targeted state class
   */
  constructor(target: Type<EntityState<any>>) {
    return generateActionObject(EntityActionType.RemoveActive, target);
  }
}

export class UpdateActive<T> {
  /**
   * Generates an action that will update the current active entity.
   * If no entity is active a runtime error will be thrown.
   * @param target The targeted state class
   * @param payload An Updater payload
   * @see Updater
   */
  constructor(target: Type<EntityState<T>>, payload: Updater<T>) {
    return generateActionObject(EntityActionType.UpdateActive, target, payload);
  }
}
