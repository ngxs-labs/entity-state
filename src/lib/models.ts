import { HashMap } from './internal';

/**
 * Interface for an EntityState.
 * Includes the entities in an object literal, the loading and error state and the ID of the active selected entity.
 */
export interface EntityStateModel<T> {
  entities: HashMap<T>;
  loading: boolean;
  error: Error | undefined;
  active: string | undefined;
  ids: string[];
  pageSize: number;
  pageIndex: number;
  lastUpdated: number;
}

export type StateSelector<T> = (state: EntityStateModel<any>) => T;
