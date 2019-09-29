import { EntityStateModel } from '../models';
import { compose, patch } from '@ngxs/store/operators';
import { Dictionary } from '../internal';
import { StateOperator } from '@ngxs/store';
import { Predicate } from '@ngxs/store/operators/internals';
import { updateTimestamp } from '@ngxs-labs/entity-state';

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
    clearActiveOnRemoval(ids),
    updateTimestamp()
  );
}

/**
 * Only clears the `active` entity, if it's included in the given array.
 * All other fields will remain untouched in any case.
 * @param idsForRemoval the IDs to be removed
 */
export function clearActiveOnRemoval<T>(
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
    return existing.filter(v => !forRemoval.includes(v));
  };
}

/**
 * Removes all items from the existing items that match the given predicate.
 * @param predicate predicate to determine if item should be removed
 */
export function removeEntitiesByPredicate<T>(
  predicate: Predicate<T>
): StateOperator<Array<T>> {
  return (existing: ReadonlyArray<T>) => {
    return existing.filter(v => predicate(v));
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
    keysForRemoval.forEach(s => delete clone[s]);
    return clone;
  };
}
