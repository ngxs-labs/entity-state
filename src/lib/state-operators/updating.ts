import { StateOperator } from '@ngxs/store';
import { asArray, Dictionary, mustGetActive } from '../internal';
import { EntityStateModel } from '../models';
import { EntitySelector, EntityUpdate, Updater } from '../actions';
import { InvalidIdError, NoSuchEntityError, UpdateFailedError } from '../errors';

export type OnUpdate<T> = (current: Readonly<T>, updated: Partial<T>) => T;

/**
 * Updates the given entities in the state.
 * Entities will be merged with the given `onUpdate` function.
 * @param payload the updated entities
 * @param idKey key of the id-field of an entity
 * @param onUpdate update function to call on each entity
 */
export function update<T>(
  payload: EntityUpdate<T>,
  idKey: string,
  onUpdate: OnUpdate<T>
): StateOperator<EntityStateModel<T>> {
  return (state: EntityStateModel<T>) => {
    let entities = { ...state.entities }; // create copy

    const affected = getAffectedValues(Object.values(entities), payload.selector, idKey);

    if (typeof payload.data === 'function') {
      affected.forEach(entity => {
        entities = updateDictionary(
          entities,
          (<Function>payload.data)(entity),
          entity[idKey],
          onUpdate
        );
      });
    } else {
      affected.forEach(entity => {
        entities = updateDictionary(
          entities,
          payload.data as Partial<T>,
          entity[idKey],
          onUpdate
        );
      });
    }

    return {
      ...state,
      entities,
      lastUpdated: Date.now()
    };
  };
}

export function updateActive<T>(payload: Updater<T>, idKey: string, onUpdate: OnUpdate<T>) {
  return (state: EntityStateModel<T>) => {
    const { id: activeId, active } = mustGetActive(state);
    const { entities } = state;

    if (typeof payload === 'function') {
      return {
        ...state,
        entities: updateDictionary(entities, payload(active), activeId, onUpdate),
        lastUpdated: Date.now()
      };
    } else {
      return {
        ...state,
        entities: updateDictionary(entities, payload, activeId, onUpdate),
        lastUpdated: Date.now()
      };
    }
  };
}

export function updateDictionary<T>(
  entities: Dictionary<T>,
  entity: Partial<T>,
  id: string,
  onUpdate: OnUpdate<T>
): Dictionary<T> {
  if (id === undefined) {
    throw new UpdateFailedError(new InvalidIdError(id));
  }
  const current = entities[id];
  if (current === undefined) {
    throw new UpdateFailedError(new NoSuchEntityError(id));
  }
  const updated = onUpdate(current, entity);
  return { ...entities, [id]: updated };
}

function getAffectedValues<T>(entities: T[], selector: EntitySelector<T>, idKey: string): T[] {
  if (selector === null) {
    return entities;
  } else if (typeof selector === 'function') {
    return entities.filter(entity => (<Function>selector)(entity));
  } else {
    const ids = asArray(selector);
    return entities.filter(entity => ids.includes(entity[idKey]));
  }
}
