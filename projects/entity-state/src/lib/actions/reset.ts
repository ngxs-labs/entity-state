import {generateActionObject} from '../internal';
import {ExtendsEntityStore} from '../entity-store';

export function Reset(store: ExtendsEntityStore<any>): {} {
  return generateActionObject('reset', store);
}
