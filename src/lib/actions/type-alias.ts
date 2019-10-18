/**
 * An EntitySelector determines which entities will be affected.
 * Can be one of the following:
 * - one or multiple IDs in form of a string or an array of strings
 * - a function that returns true for entities to be selected
 * - null to select all entities
 */
export type EntitySelector<T> = string | string[] | ((entity: T) => boolean) | null;

/**
 * An Updater will be applied to the current entity, before onUpdate is run with its result.
 * Can be one of the following:
 * - a partial object of an entity
 * - a function that takes the current entity and returns a partially updated entity
 * @see EntityState#onUpdate
 */
export type Updater<T> = Partial<T> | ((entity: Readonly<T>) => Partial<T>);

/**
 * Interface for an object that has a payload field of type T
 */
export interface Payload<T> {
  payload: T;
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
