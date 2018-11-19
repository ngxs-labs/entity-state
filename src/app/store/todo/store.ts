import {State} from '@ngxs/store';
import {defaultEntityState, EntityStateModel, EntityStore} from 'entity-state';

export interface ToDo {
  title: string;
  description: string;
  done: boolean;
}

@State<EntityStateModel<ToDo>>({
  name: 'todo',
  defaults: defaultEntityState()
})
export class TodoState extends EntityStore<ToDo> {

  constructor() {
    super(TodoState, "title");
  }

  onUpdate(current: ToDo, updated: Partial<ToDo>): ToDo {
    return {...current, ...updated};
  }

}
