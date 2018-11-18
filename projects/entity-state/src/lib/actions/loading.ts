import {generateActionObject} from '../internal';
import {ExtendsEntityStore} from '../entity-store';


export interface EntitySetLoadingAction {
  payload: boolean;
}

export function SetLoading(store: ExtendsEntityStore<any>, loading: boolean): EntitySetLoadingAction {
  return generateActionObject("setLoading", store, loading);
}
