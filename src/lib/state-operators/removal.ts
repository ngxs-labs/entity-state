import { StateOperator } from '@ngxs/store';
import { compose, patch } from '@ngxs/store/operators';
import { Predicate } from '@ngxs/store/operators/internals';
import { Dictionary } from '../internal';
import { EntityStateModel } from '../models';
import { updateTimestamp } from './timestamp';

/**
 * Removes all entities, clears the active entity and updates the `lastUpdated` timestamp.
 */
export function removeAllEntities<T>(): StateOperator<EntityStateModel<T>> {
  return (state: EntityStateModel<T>) => {
    return {
      ...state,
      entities: {},
      ids: [],
      active: undefined,
      lastUpdated: Date.now()
    };
  };
}

/**
 * Removes the entities specified by the given IDs.
 * The active entity will be cleared if included in the given IDs.
 * Updates the `lastUpdated` timestamp.
 * @param ids IDs to remove
 */
export function removeEntities<T>(ids: string[]): StateOperator<EntityStateModel<T>> {
  const entityRemoval = patch<EntityStateModel<any>>({
    entities: removeEntitiesFromDictionary(ids),
    ids: removeEntitiesFromArray(ids)
  });
  return compose(
    entityRemoval,
    clearActiveIfRemoved(ids),
    updateTimestamp()
  );
}

/**
 * Only clears the `active` entity, if it's included in the given array.
 * All other fields will remain untouched in any case.
 * @param idsForRemoval the IDs to be removed
 */
export function clearActiveIfRemoved<T>(
  idsForRemoval: string[]
): StateOperator<EntityStateModel<T>> {
  return (state: EntityStateModel<any>) => {
    return {
      ...state,
      active: idsForRemoval.includes(state.active) ? undefined : state.active
    };
  };
}

/**
 * Removes the given items from the existing items, based on equality.
 * @param forRemoval items to remove
 */
export function removeEntitiesFromArray<T>(forRemoval: T[]): StateOperator<Array<T>> {
  return (existing: ReadonlyArray<T>) => {
    return existing.filter(value => !forRemoval.includes(value));
  };
}

/**
 * Removes items from the dictionary, based on the given keys.
 * @param keysForRemoval the keys to be removed
 */
export function removeEntitiesFromDictionary<T>(
  keysForRemoval: string[]
): StateOperator<Dictionary<T>> {
  return (existing: Readonly<Dictionary<T>>): Dictionary<T> => {
    const clone = { ...existing };
    keysForRemoval.forEach(key => delete clone[key]);
    return clone;
  };
}
