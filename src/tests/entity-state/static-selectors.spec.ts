import { State } from '@ngxs/store';
import { defaultEntityState, EntityState } from '../../lib/entity-state';
import { EntityStateModel } from '../../lib/models';
import { IdStrategy } from '../../lib/id-strategy';
import { NGXS_META_KEY } from '../../lib/internal';

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

describe('EntityState selectors', () => {
  let state: { todo: EntityStateModel<ToDo> };

  beforeAll(() => {
    TestState[NGXS_META_KEY].path = 'todo';
  });

  beforeEach(() => {
    state = {
      todo: defaultEntityState({
        entities: {
          a: { title: 'a' },
          b: { title: 'b' },
          c: { title: 'c' },
          d: { title: 'd' },
          e: { title: 'e' },
          f: { title: 'f' },
          g: { title: 'g' }
        },
        ids: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
        pageSize: 2,
        active: 'a',
        error: new Error('Test Error')
      })
    };
  });

  it('should select activeId', () => {
    const selector = TestState.activeId as any;
    const activeId = selector(state);
    expect(activeId).toBe('a');
  });

  it('should select active', () => {
    const selector = TestState.active as any;
    const active = selector(state);
    expect(active).toEqual({ title: 'a' });
  });

  it('should select keys', () => {
    const selector = TestState.keys as any;
    const keys = selector(state);
    expect(keys).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g']);
  });

  it('should select entities', () => {
    const selector = TestState.entities as any;
    const entities = selector(state);
    expect(entities).toEqual([
      { title: 'a' },
      { title: 'b' },
      { title: 'c' },
      { title: 'd' },
      { title: 'e' },
      { title: 'f' },
      { title: 'g' }
    ]);
  });

  it('should select nth entities', () => {
    const selector = TestState.nthEntity(2) as any;
    const entities = selector(state);
    expect(entities).toEqual({ title: 'c' });
  });

  it('should select paginated entities', () => {
    const selector = TestState.paginatedEntities as any;
    let entities = selector(state);
    expect(entities).toEqual([{ title: 'a' }, { title: 'b' }]);

    state.todo.pageIndex = 1;
    entities = selector(state);
    expect(entities).toEqual([{ title: 'c' }, { title: 'd' }]);

    state.todo.pageIndex = 3;
    entities = selector(state);
    expect(entities).toEqual([{ title: 'g' }]);
  });

  it('should select entitiesMap', () => {
    const selector = TestState.entitiesMap as any;
    const entitiesMap = selector(state);
    expect(entitiesMap).toEqual({
      a: { title: 'a' },
      b: { title: 'b' },
      c: { title: 'c' },
      d: { title: 'd' },
      e: { title: 'e' },
      f: { title: 'f' },
      g: { title: 'g' }
    });
  });

  it('should select size', () => {
    const selector = TestState.size as any;
    const size = selector(state);
    expect(size).toBe(7);
  });

  it('should select error', () => {
    const selector = TestState.error as any;
    const error = selector(state);
    expect(error.message).toBe('Test Error');
  });

  it('should select loading', () => {
    const selector = TestState.loading as any;
    const loading = selector(state);
    expect(loading).toBe(false);
  });

  it('should select latest', () => {
    const selector = TestState.latest as any;
    const latest = selector(state);
    expect(latest).toEqual({ title: 'g' });
  });

  it('should select latestId', () => {
    const selector = TestState.latestId as any;
    const latestId = selector(state);
    expect(latestId).toBe('g');
  });

  it('should select lastUpdated', () => {
    const now = Date.now();
    state.todo.lastUpdated = now;
    const selector = TestState.lastUpdated as any;
    const lastUpdated = selector(state);
    expect(lastUpdated.getTime()).toBe(now);
  });

  it('should select age', () => {
    const now = Date.now();
    state.todo.lastUpdated = now - 10_000;
    const selector = TestState.age as any;
    const age = selector(state);
    expect(age).toBe(10_000);
  });
});
