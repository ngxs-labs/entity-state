import { State, Store, NgxsModule } from '@ngxs/store';
import { defaultEntityState, EntityState } from '../../lib/entity-state';
import { EntityStateModel } from '../../lib/models';
import { IdStrategy } from '../../lib/id-strategy';
import { NGXS_META_KEY } from '../../lib/internal';
import { TestBed } from '@angular/core/testing';
import { SetPageSize, GoToPage, CreateOrReplace } from 'src/lib/actions';

interface ToDo {
  title: string;
}

@State<EntityStateModel<ToDo>>({
  name: 'todo',
  defaults: defaultEntityState({
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
  let store: Store;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NgxsModule.forRoot([TestState])]
    });

    store = TestBed.get(Store);
  });

  it('should select activeId', () => {
    const selector = TestState.activeId as any;
    const activeId = store.selectSnapshot(selector);
    expect(activeId).toBe('a');
  });

  it('should select active', () => {
    const selector = TestState.active as any;
    const active = store.selectSnapshot(selector);
    expect(active).toEqual({ title: 'a' });
  });

  it('should select keys', () => {
    const selector = TestState.keys as any;
    const keys = store.selectSnapshot(selector);
    expect(keys).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g']);
  });

  it('should select entities', () => {
    const selector = TestState.entities as any;
    const entities = store.selectSnapshot(selector);
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
    const entities = store.selectSnapshot(selector);
    expect(entities).toEqual({ title: 'c' });
  });

  it('should select paginated entities', () => {
    const selector = TestState.paginatedEntities as any;
    let entities = store.selectSnapshot(selector);
    expect(entities).toEqual([{ title: 'a' }, { title: 'b' }]);

    store.dispatch(new GoToPage(TestState, { page: 1 }));
    entities = store.selectSnapshot(selector);
    expect(entities).toEqual([{ title: 'c' }, { title: 'd' }]);

    store.dispatch(new GoToPage(TestState, { page: 3 }));
    entities = store.selectSnapshot(selector);
    expect(entities).toEqual([{ title: 'g' }]);
  });

  it('should select entitiesMap', () => {
    const selector = TestState.entitiesMap as any;
    const entitiesMap = store.selectSnapshot(selector);
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
    const size = store.selectSnapshot(selector);
    expect(size).toBe(7);
  });

  it('should select error', () => {
    const selector = TestState.error as any;
    const error = store.selectSnapshot(selector);
    expect((error as any).message).toBe('Test Error');
  });

  it('should select loading', () => {
    const selector = TestState.loading as any;
    const loading = store.selectSnapshot(selector);
    expect(loading).toBe(false);
  });

  it('should select latest', () => {
    const selector = TestState.latest as any;
    const latest = store.selectSnapshot(selector);
    expect(latest).toEqual({ title: 'g' });
  });

  it('should select latestId', () => {
    const selector = TestState.latestId as any;
    const latestId = store.selectSnapshot(selector);
    expect(latestId).toBe('g');
  });

  it('should select lastUpdated', () => {
    const now = Date.now();
    store.dispatch(new CreateOrReplace(TestState, { title: 'h' }));
    const selector = TestState.lastUpdated as any;
    const lastUpdated: Date = store.selectSnapshot(selector);
    expect(lastUpdated.getTime()).toBeCloseTo(now, -100); // within 100ms
  });

  it('should select age', () => {
    const now = Date.now();
    store.dispatch(new CreateOrReplace(TestState, { title: 'h' }));
    const selector = TestState.age as any;
    const age = store.selectSnapshot(selector);
    expect(age).toBeCloseTo(now, -100); // within 100ms
  });
});
