import { StateOperator } from '@ngxs/store';
import { EntityStateModel } from '../models';
import { compose, patch } from '@ngxs/store/operators';

export function updateTimestamp(): StateOperator<EntityStateModel<any>> {
  return patch<EntityStateModel<any>>({
    lastUpdated: Date.now()
  });
}

export function alsoUpdateTimestamp(
  operator: StateOperator<EntityStateModel<any>>
): StateOperator<EntityStateModel<any>> {
  return compose(
    updateTimestamp(),
    operator
  );
}
