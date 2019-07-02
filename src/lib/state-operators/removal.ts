import { EntityStateModel } from '../models';
import { compose, patch } from '@ngxs/store/operators';
import { HashMap } from '../internal';
import { StateOperator } from '@ngxs/store';
import { Predicate } from '@ngxs/store/operators/internals';
import { updateTimestamp } from '@ngxs-labs/entity-state';

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

export function removeEntities<T>(ids: string[]): StateOperator<EntityStateModel<T>> {
  const entityRemoval = patch<EntityStateModel<any>>({
    entities: removeEntitiesFromMap(ids),
    ids: removeEntitiesFromArray(ids)
  });
  return compose(
    entityRemoval,
    clearActiveOnRemoval(ids),
    updateTimestamp()
  );
}

export function clearActiveOnRemoval<T>(
  forRemoval: string[]
): StateOperator<EntityStateModel<T>> {
  return (state: EntityStateModel<any>) => {
    return {
      ...state,
      active: forRemoval.includes(state.active) ? undefined : state.active
    };
  };
}

export function removeEntitiesFromArray<T>(forRemoval: T[]): StateOperator<Array<T>> {
  return (existing: ReadonlyArray<T>) => {
    return existing.filter(v => !forRemoval.includes(v));
  };
}

export function removeEntitiesByPredicate<T>(
  predicate: Predicate<T>
): StateOperator<Array<T>> {
  return (existing: ReadonlyArray<T>) => {
    return existing.filter(v => predicate(v));
  };
}

export function removeEntitiesFromMap<T>(selector: string[]): StateOperator<HashMap<T>> {
  return (existing: Readonly<HashMap<T>>): HashMap<T> => {
    const clone = { ...existing };
    selector.forEach(s => delete clone[s]);
    return clone;
  };
}
