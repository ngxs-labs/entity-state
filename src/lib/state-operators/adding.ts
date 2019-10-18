import { StateOperator } from '@ngxs/store';
import { asArray } from '../internal';
import { EntityStateModel, IdProvider } from '../models';

/**
 * Adds or replaces the given entities to the state.
 * For each entity an ID will be calculated, based on the given provider.
 * This operator ensures that the calculated ID is added to the entity, at the specified id-field.
 * The `lastUpdated` timestamp will be updated.
 * @param entities the new entities to add or replace
 * @param idKey key of the id-field of an entity
 * @param idProvider function to provide an ID for the given entity
 */
export function addOrReplace<T>(
  entities: T | T[],
  idKey: string,
  idProvider: IdProvider<T>
): StateOperator<EntityStateModel<T>> {
  return (state: EntityStateModel<T>) => {
    const nextEntities = { ...state.entities };
    const nextIds = [...state.ids];
    let nextState = state; // will be reassigned while looping over new entities

    asArray(entities).forEach(entity => {
      const id = idProvider(entity, nextState);
      let updatedEntity = entity;
      if (entity[idKey] !== id) {
        // ensure ID is in the entity
        updatedEntity = { ...entity, [idKey]: id };
      }
      nextEntities[id] = updatedEntity;
      if (!nextIds.includes(id)) {
        nextIds.push(id);
      }
      nextState = {
        ...nextState,
        entities: nextEntities,
        ids: nextIds
      };
    });

    return {
      ...nextState,
      entities: nextEntities,
      ids: nextIds,
      lastUpdated: Date.now()
    };
  };
}
