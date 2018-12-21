import {State} from '@ngxs/store';
import {defaultEntityState, EntityStateModel, EntityState, IdStrategy} from 'entity-state';

export interface ToDo {
  title: string;
  description: string;
  done: boolean;
}

@State<EntityStateModel<ToDo>>({
  name: 'todo',
  defaults: defaultEntityState()
})
export class TodoState extends EntityState<ToDo> {

  constructor() {
    super(TodoState, "title", IdStrategy.EntityIdGenerator);
  }

  onUpdate(current: Readonly<ToDo>, updated: Partial<ToDo>): ToDo {
    return {...current, ...updated};
  }

}
