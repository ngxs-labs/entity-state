import {generateActionObject} from '../internal';
import {ExtendsEntityStore} from '../entity-store';

export interface EntitySetErrorAction {
  payload: Error;
}

export function SetError(store: ExtendsEntityStore<any>, error: Error | undefined): EntitySetErrorAction {
  return generateActionObject("setError", store, error);
}
