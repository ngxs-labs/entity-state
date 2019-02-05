import { EntityState } from './entity-state';
import { Type } from '@angular/core';
import { NoActiveEntityError } from './errors';
import { EntityStateModel } from './models';

/**
 * type alias for javascript object literal
 */
export interface HashMap<T> {
  [id: string]: T;
}

export const NGXS_META_KEY = 'NGXS_META';

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
  const name = store[NGXS_META_KEY].path;
  const ReflectedAction = function(data: T) {
    this.payload = data;
  };
  const obj = new ReflectedAction(payload);
  Reflect.getPrototypeOf(obj).constructor['type'] = `[${name}] ${fn}`;
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
export enum EntityActionType {
  Add = 'add',
  CreateOrReplace = 'createOrReplace',
  Update = 'update',
  UpdateActive = 'updateActive',
  Remove = 'remove',
  RemoveActive = 'removeActive',
  SetLoading = 'setLoading',
  SetError = 'setError',
  SetActive = 'setActive',
  ClearActive = 'clearActive',
  Reset = 'reset',
  GoToPage = 'goToPage',
  SetPageSize = 'setPageSize'
}

/**
 * Returns the active entity. If none is present an error will be thrown.
 * @param state The state to act on
 */
export function mustGetActive<T>(state: EntityStateModel<T>): { id: string; active: T } {
  const active = getActive(state);
  if (active === undefined) {
    throw new NoActiveEntityError();
  }
  return { id: state.active, active };
}

/**
 * Undefined-safe function to access the property given by path parameter
 * @param object The object to read from
 * @param path The path to the property
 */
export function elvis(object: any, path: string): any | undefined {
  return path ? path.split('.').reduce((value, key) => value && value[key], object) : object;
}

/**
 * Returns input as an array if it isn't one already
 * @param input The input to make an array if necessary
 */
export function asArray<T>(input: T | T[]): T[] {
  return Array.isArray(input) ? input : [input];
}

/**
 * Limits a number to the given boundaries
 * @param value The input value
 * @param min The minimum value
 * @param max The maximum value
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Uses the clamp function is wrap is false.
 * Else it wrap to the max or min value respectively.
 * @param wrap Flag to indicate if value should be wrapped
 * @param value The input value
 * @param min The minimum value
 * @param max The maximum value
 */
export function wrapOrClamp(wrap: boolean, value: number, min: number, max: number): number {
  if (!wrap) {
    return clamp(value, min, max);
  } else if (value < min) {
    return max;
  } else if (value > max) {
    return min;
  } else {
    return value;
  }
}
