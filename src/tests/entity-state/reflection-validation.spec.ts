import { State } from '@ngxs/store';
import { defaultEntityState, EntityState } from '../../lib/entity-state';
import { EntityStateModel } from '../../lib/models';
import { IdStrategy } from '../../lib/id-strategy';
import { NGXS_META_KEY } from '../../lib/internal';
import { EntityActionType } from '../../lib/actions/type-alias';

interface ToDo {
  title: string;
}

@State<EntityStateModel<ToDo>>({
  name: 'todo',
  defaults: defaultEntityState()
})
class TestState extends EntityState<ToDo> {
  constructor() {
    super(TestState, 'title', IdStrategy.EntityIdGenerator);
  }

  onUpdate(current: Readonly<ToDo>, updated: Readonly<Partial<ToDo>>): ToDo {
    return { ...current, ...updated };
  }
}

describe('EntityState reflection validation', () => {
  beforeAll(() => {
    TestState[NGXS_META_KEY].path = 'todo';
  });

  it('should find all actions in state class', () => {
    // replaces validation in EntityState#setup
    const actions = Object.values(EntityActionType);
    const baseProto = Reflect.getPrototypeOf(TestState.prototype);

    // uses find to see which one is missing in the error message
    const missing = actions.find(action => !(action in baseProto));
    expect(missing).toBeUndefined();
  });

  it('should match the methods with the action names', () => {
    // replaces @EntityActionHandler validation
    const instance = new TestState();
    const protoKeys = Object.keys(Reflect.getPrototypeOf(Reflect.getPrototypeOf(instance)));
    // you have to manually exclude certain methods, which are not action handlers
    // TODO: Add Reflect Meta-data with @EntityActionHandler annotation and query it here?
    const exclude = ['idOf', 'setup', 'onUpdate', '_update', '_addOrReplace'];
    const actionHandlers = protoKeys.filter(key => !exclude.includes(key));

    // actual test
    const entityActionTypeValues = Object.values(EntityActionType);
    // uses find to see which one is missing in the error message
    const missing = actionHandlers.find(fn => !entityActionTypeValues.includes(fn));
    expect(missing).toBeUndefined();
  });
});
