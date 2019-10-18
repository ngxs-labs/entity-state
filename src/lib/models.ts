import { Dictionary } from './internal';

/**
 * Interface for an EntityState.
 * Includes the entities in an object literal, the loading and error state and the ID of the active selected entity.
 */
export interface EntityStateModel<T> {
  entities: Dictionary<T>;
  loading: boolean;
  error: Error | undefined;
  active: string | undefined;
  ids: string[];
  pageSize: number;
  pageIndex: number;
  lastUpdated: number;
}

export type StateSelector<T> = (state: EntityStateModel<any>) => T;

export type DeepReadonly<T> = T extends (infer R)[]
  ? DeepReadonlyArray<R>
  : T extends Function
  ? T
  : T extends object
  ? DeepReadonlyObject<T>
  : T;

// This should be ReadonlyArray but it has implications.
export interface DeepReadonlyArray<T> extends Array<DeepReadonly<T>> {}

export type DeepReadonlyObject<T> = { readonly [P in keyof T]: DeepReadonly<T[P]> };

/**
 * Function that provides an ID for the given entity
 */
export type IdProvider<T> = (entity: Partial<T>, state: EntityStateModel<T>) => string;
