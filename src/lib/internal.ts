import { EntityState, EntityStateModel } from './entity-state';
import { Type } from '@angular/core';

/**
 * type alias for javascript object literal
 */
export interface HashMap<T> {
  [id: string]: T;
}

/**
 * This function generates a new object for the ngxs Action with the given fn name
 * @param fn The name of the Action to simulate, e.g. "Remove" or "Update"
 * @param store The class of the targeted entity state, e.g. ZooState
 * @param payload The payload for the created action object
 */
export function generateActionObject<T>(
  fn: string,
  store: Type<EntityState<T>>,
  payload?: any
) {
  const name = store['NGXS_META'].path;
  const ReflectedAction = function(data: T) {
    this.payload = data;
  };
  const obj = new ReflectedAction(payload);
  obj.__proto__.constructor.type = `[${name}] ${fn}`;
  return obj;
}

/**
 * Utility function that returns the active entity of the given state
 * @param state the state of an entity state
 */
export function getActive<T>(state: EntityStateModel<T>): T {
  return state.entities[state.active];
}

/**
 * Enum that contains all existing Actions for the Entity State adapter.
 */
export enum ActionNames {
  add = 'add',
  createOrReplace = 'createOrReplace',
  update = 'update',
  updateActive = 'updateActive',
  remove = 'remove',
  removeActive = 'removeActive',
  setLoading = 'setLoading',
  setError = 'setError',
  setActive = 'setActive',
  clearActive = 'clearActive',
  reset = 'reset',
  goToPage = 'goToPage',
  setPageSize = 'setPageSize'
}
