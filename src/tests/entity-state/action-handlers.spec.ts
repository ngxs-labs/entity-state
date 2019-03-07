import { State, StateContext } from '@ngxs/store';
import { defaultEntityState, EntityState } from '../../lib/entity-state';
import { EntityStateModel } from '../../lib/models';
import { IdStrategy } from '../../lib/id-strategy';
import { NGXS_META_KEY } from '../../lib/internal';
import { UnableToGenerateIdError } from '../../lib/errors';

interface ToDo {
  title: string;
  test?: number;
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

describe('EntityState action handlers', () => {
  let state: { todo: EntityStateModel<ToDo> };
  let stateInstance: EntityState<ToDo>;

  function mockStateContext(
    patchState?: (val: Partial<EntityStateModel<ToDo>>) => any,
    setState?: (val: EntityStateModel<ToDo>) => any
  ): StateContext<EntityStateModel<ToDo>> {
    return {
      getState: () => state.todo,
      patchState: patchState,
      setState: setState,
      dispatch: () => undefined
    };
  }

  beforeAll(() => {
    TestState[NGXS_META_KEY].path = 'todo';
  });

  beforeEach(() => {
    stateInstance = new TestState();
    state = {
      todo: defaultEntityState({
        entities: {
          a: { title: 'a' },
          b: { title: 'b' },
          c: { title: 'c' }
        },
        ids: ['a', 'b', 'c'],
        pageSize: 2,
        active: 'a',
        error: new Error('Test Error')
      })
    };
  });

  describe('add', () => {
    it('should add an entity', () => {
      const context = mockStateContext(val => {
        expect(val.entities).toEqual({
          a: { title: 'a' },
          b: { title: 'b' },
          c: { title: 'c' },
          d: { title: 'd' }
        });
        expect(val.ids).toEqual(['a', 'b', 'c', 'd']);
      });
      stateInstance.add(context, { payload: { title: 'd' } });
    });

    it('should throw an error for existing IDs', () => {
      const context = mockStateContext();
      try {
        stateInstance.add(context, { payload: { title: 'a' } });
      } catch (e) {
        expect(e.message).toBe(
          new UnableToGenerateIdError('The provided ID already exists: a').message
        );
      }
    });

    it('should update lastUpdated', () => {
      const context = mockStateContext(val => {
        expect(val.lastUpdated).toBeCloseTo(Date.now(), -100); // within 100ms
      });
      stateInstance.add(context, { payload: { title: 'd' } });
    });
  });

  describe('createOrReplace', () => {
    it('should add a new entity for a new ID', () => {
      const context = mockStateContext(val => {
        expect(val.entities).toEqual({
          a: { title: 'a' },
          b: { title: 'b' },
          c: { title: 'c' },
          d: { title: 'd' }
        });
        expect(val.ids).toEqual(['a', 'b', 'c', 'd']);
      });
      stateInstance.createOrReplace(context, { payload: { title: 'd' } });
    });

    it('should replace an entity for an existing ID', () => {
      const context = mockStateContext(val => {
        expect(val.entities).toEqual({
          a: { title: 'a' },
          b: { title: 'b' },
          c: { title: 'c' }
        });
        expect(val.ids).toEqual(['a', 'b', 'c']);
      });

      stateInstance.createOrReplace(context, { payload: { title: 'a' } });
    });

    it('should update lastUpdated', () => {
      const context = mockStateContext(val => {
        expect(val.lastUpdated).toBeCloseTo(Date.now(), -100); // within 100ms
      });
      stateInstance.createOrReplace(context, { payload: { title: 'd' } });
    });
  });

  describe('update', () => {
    // update works with EntitySelector<T> = string | string[] | ((T) => boolean) | null;
    // update works with Updater<T> = Partial<T> | ((entity: Readonly<T>) => Partial<T>);

    describe('partial entity updates', () => {
      it('should update by single ID', () => {
        const context = mockStateContext(val => {
          expect(val.entities).toEqual({
            a: { title: 'a', test: 42 },
            b: { title: 'b' },
            c: { title: 'c' }
          });
        });

        stateInstance.update(context, {
          payload: {
            id: 'a',
            data: { test: 42 }
          }
        });
      });

      it('should update by multiple IDs', () => {
        const context = mockStateContext(val => {
          console.log('val.entities:', val.entities);
          expect(val.entities).toEqual({
            a: { title: 'a', test: 42 },
            b: { title: 'b', test: 42 },
            c: { title: 'c' }
          });
        });

        stateInstance.update(context, {
          payload: {
            id: ['a', 'b'],
            data: { test: 42 }
          }
        });
      });

      it('should update by predicate', () => {
        const context = mockStateContext(val => {
          expect(val.entities).toEqual({
            a: { title: 'a', test: 42 },
            b: { title: 'b', test: 42 },
            c: { title: 'c' }
          });
        });

        stateInstance.update(context, {
          payload: {
            id: entity => entity.title !== 'c',
            data: { test: 42 }
          }
        });
      });

      it('should update all with null', () => {
        const context = mockStateContext(val => {
          expect(val.entities).toEqual({
            a: { title: 'a', test: 42 },
            b: { title: 'b', test: 42 },
            c: { title: 'c', test: 42 }
          });
        });

        stateInstance.update(context, {
          payload: {
            id: null,
            data: { test: 42 }
          }
        });
      });

      it('should update lastUpdated', () => {
        const context = mockStateContext(val => {
          expect(val.lastUpdated).toBeCloseTo(Date.now(), -100); // within 100ms
        });

        stateInstance.update(context, {
          payload: {
            id: null,
            data: { test: 42 }
          }
        });
      });
    });

    describe('function updates', () => {
      it('should update by single ID', () => {
        const context = mockStateContext(val => {
          expect(val.entities).toEqual({
            a: { title: 'a', test: 42 },
            b: { title: 'b' },
            c: { title: 'c' }
          });
        });

        stateInstance.update(context, {
          payload: {
            id: 'a',
            data: () => ({ test: 42 })
          }
        });
      });

      it('should update by multiple IDs', () => {
        const context = mockStateContext(val => {
          console.log('val.entities:', val.entities);
          expect(val.entities).toEqual({
            a: { title: 'a', test: 42 },
            b: { title: 'b', test: 42 },
            c: { title: 'c' }
          });
        });

        stateInstance.update(context, {
          payload: {
            id: ['a', 'b'],
            data: () => ({ test: 42 })
          }
        });
      });

      it('should update by predicate', () => {
        const context = mockStateContext(val => {
          expect(val.entities).toEqual({
            a: { title: 'a', test: 42 },
            b: { title: 'b', test: 42 },
            c: { title: 'c' }
          });
        });

        stateInstance.update(context, {
          payload: {
            id: entity => entity.title !== 'c',
            data: () => ({ test: 42 })
          }
        });
      });

      it('should update all with null', () => {
        const context = mockStateContext(val => {
          expect(val.entities).toEqual({
            a: { title: 'a', test: 42 },
            b: { title: 'b', test: 42 },
            c: { title: 'c', test: 42 }
          });
        });

        stateInstance.update(context, {
          payload: {
            id: null,
            data: () => ({ test: 42 })
          }
        });
      });
    });
  });

  describe('updateActive', () => {
    // updateActive works with Updater<T> = Partial<T> | ((entity: Readonly<T>) => Partial<T>);

    it('should update the active entity by partial entity', () => {
      const context = mockStateContext(val => {
        expect(val.entities).toEqual({
          a: { title: 'a', test: 42 },
          b: { title: 'b' },
          c: { title: 'c' }
        });
      });
      stateInstance.updateActive(context, { payload: { test: 42 } as any });
    });

    it('should update the active entity by update fn', () => {
      const context = mockStateContext(val => {
        expect(val.entities).toEqual({
          a: { title: 'a', test: 42 },
          b: { title: 'b' },
          c: { title: 'c' }
        });
      });
      stateInstance.updateActive(context, { payload: () => ({ test: 42 } as any) });
    });

    it('should update lastUpdated', () => {
      const context = mockStateContext(val => {
        expect(val.lastUpdated).toBeCloseTo(Date.now(), -100); // within 100ms
      });

      stateInstance.updateActive(context, { payload: () => ({ test: 42 } as any) });
    });
  });

  describe('removeActive', () => {
    it('should remove the active entity', () => {
      expect(state.todo.active).toBe('a'); // verify test data
      const context = mockStateContext(val => {
        expect(val.active).toBeUndefined();
        expect(val.entities).toEqual({
          b: { title: 'b' },
          c: { title: 'c' }
        });
        expect(val.ids).toEqual(['b', 'c']);
      });
      stateInstance.removeActive(context);
    });

    it('should update lastUpdated', () => {
      const context = mockStateContext(val => {
        expect(val.lastUpdated).toBeCloseTo(Date.now(), -100); // within 100ms
      });

      stateInstance.removeActive(context);
    });
  });

  describe('remove', () => {
    // remove works with EntitySelector<T> = string | string[] | ((T) => boolean) | null;

    it('should remove by single ID', () => {
      const context = mockStateContext(val => {
        expect(val.active).toBeUndefined();
        expect(val.entities).toEqual({
          b: { title: 'b' },
          c: { title: 'c' }
        });
        expect(val.ids).toEqual(['b', 'c']);
      });
      stateInstance.remove(context, { payload: 'a' });
    });

    it('should remove by multiple IDs', () => {
      const context = mockStateContext(val => {
        expect(val.active).toBeUndefined();
        expect(val.entities).toEqual({
          b: { title: 'b' }
        });
        expect(val.ids).toEqual(['b']);
      });
      stateInstance.remove(context, { payload: ['a', 'c'] });
    });

    it('should remove by predicate', () => {
      const context = mockStateContext(val => {
        expect(val.active).toBeUndefined();
        expect(val.entities).toEqual({
          b: { title: 'b' }
        });
        expect(val.ids).toEqual(['b']);
      });
      stateInstance.remove(context, { payload: entity => entity.title !== 'b' });
    });

    it('should remove all with null', () => {
      const context = mockStateContext(val => {
        expect(val.active).toBeUndefined();
        expect(val.entities).toEqual({});
        expect(val.ids).toEqual([]);
      });
      stateInstance.remove(context, { payload: null });
    });

    it('should update lastUpdated', () => {
      const context = mockStateContext(val => {
        expect(val.lastUpdated).toBeCloseTo(Date.now(), -100); // within 100ms
      });

      stateInstance.remove(context, { payload: null });
    });
  });

  describe('reset', () => {
    it('should reset the state to default', () => {
      const context = mockStateContext(undefined, val => {
        const _val = { ...val };
        delete _val.lastUpdated;

        const _default = { ...defaultEntityState() } as any;
        delete _default.lastUpdated;

        expect(_val).toEqual(_default);
      });
      stateInstance.reset(context);
    });

    it('should update lastUpdated', () => {
      const context = mockStateContext(undefined, val => {
        expect(val.lastUpdated).toBeCloseTo(Date.now(), -100); // within 100ms
      });

      stateInstance.reset(context);
    });
  });

  describe('setLoading', () => {
    it('should set the loading state', () => {
      expect(state.todo.loading).toBe(false); // verify test data
      const context = mockStateContext(val => {
        expect(val.loading).toBe(true);
      });
      stateInstance.setLoading(context, { payload: true });
    });
  });

  describe('setActive', () => {
    it('should set the active entity ID', () => {
      const context = mockStateContext(val => {
        expect(val.active).toBe('b');
      });
      stateInstance.setActive(context, { payload: 'b' });
    });
  });

  describe('clearActive', () => {
    it('should set the active entity ID', () => {
      const context = mockStateContext(val => {
        expect(val.active).toBeUndefined();
      });
      stateInstance.clearActive(context);
    });
  });

  describe('setError', () => {
    it('should set an error', () => {
      const context = mockStateContext(val => {
        expect(val.error).toEqual(new Error('Example Error'));
      });
      stateInstance.setError(context, { payload: new Error('Example Error') });
    });
  });

  describe('goToPage', () => {
    // the wrap flag is optional for creating certain actions, but required by the state
    // the library takes care of this in usage, but not for these tests.

    it('should set with page', () => {
      const context = mockStateContext(val => {
        expect(val.pageIndex).toBe(50);
      });
      stateInstance.goToPage(context, { payload: { page: 50, wrap: false } });
    });

    it('should set with first', () => {
      const context = mockStateContext(val => {
        expect(val.pageIndex).toBe(0);
      });
      stateInstance.goToPage(context, { payload: { first: true, wrap: false } });
    });

    it('should set with last', () => {
      const context = mockStateContext(val => {
        expect(val.pageIndex).toBe(1);
      });
      stateInstance.goToPage(context, { payload: { last: true, wrap: false } });
    });

    it('should set with prev', () => {
      const context = mockStateContext(val => {
        expect(val.pageIndex).toBe(0);
      });
      stateInstance.goToPage(context, { payload: { prev: true, wrap: false } });
    });

    it('should set with prev and wrap', () => {
      const context = mockStateContext(val => {
        expect(val.pageIndex).toBe(1);
      });
      stateInstance.goToPage(context, { payload: { prev: true, wrap: true } });
    });

    it('should set with next', () => {
      const context = mockStateContext(val => {
        expect(val.pageIndex).toBe(1);
      });
      stateInstance.goToPage(context, { payload: { next: true, wrap: false } });
    });

    it('should set with next and wrap', () => {
      state.todo.pageIndex = 1;
      const context = mockStateContext(val => {
        expect(val.pageIndex).toBe(0);
      });
      stateInstance.goToPage(context, { payload: { next: true, wrap: true } });
    });
  });

  describe('setPageSize', () => {
    it('should set the page size', () => {
      const context = mockStateContext(val => {
        expect(val.pageSize).toBe(100);
      });
      stateInstance.setPageSize(context, { payload: 100 });
    });
  });
});
