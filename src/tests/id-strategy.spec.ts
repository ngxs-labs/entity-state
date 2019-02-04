import { EntityStateModel } from '../lib/models';
import { InvalidIdOfError } from '../lib/errors';
import { IdStrategy } from '../lib/id-strategy';
import IdGenerator = IdStrategy.IdGenerator;
import IncrementingIdGenerator = IdStrategy.IncrementingIdGenerator;
import UUIDGenerator = IdStrategy.UUIDGenerator;
import EntityIdGenerator = IdStrategy.EntityIdGenerator;

describe('ID generator', () => {
  function getImplementations(): IdGenerator<Todo>[] {
    return [
      new IncrementingIdGenerator<Todo>('id'),
      new UUIDGenerator<Todo>('id'),
      new EntityIdGenerator<Todo>('id')
    ];
  }

  function getState(): EntityStateModel<Todo> {
    return {
      active: undefined,
      error: undefined,
      loading: false,
      pageIndex: 0,
      pageSize: 10,
      lastUpdated: Date.now(),
      ids: ['0', '1', '2', '3'],
      entities: {
        '0': {
          id: '0',
          title: 'Todo 0'
        },
        '1': {
          id: '1',
          title: 'Todo 1'
        },
        '2': {
          id: '2',
          title: 'Todo 2'
        },
        '3': {
          id: '3',
          title: 'Todo 3'
        }
      }
    };
  }

  it('should check if ID is present in state', () => {
    getImplementations().forEach(generator => {
      expect(generator.isIdInState('0', getState())).toBe(true);
      expect(generator.isIdInState('5', getState())).toBe(false);
    });
  });

  it('should get the ID of given entity', () => {
    getImplementations().forEach(generator => {
      expect(generator.getIdOf({ id: '0', title: 'Todo 0' })).toBe('0');
      expect(generator.getIdOf({ title: 'Todo 0' })).toBe(undefined);
    });
  });

  it('should throw an error if ID is required but undefined', () => {
    getImplementations().forEach(generator => {
      try {
        generator.mustGetIdOf({ title: 'Todo 0' });
      } catch (e) {
        expect(e.message).toBe(new InvalidIdOfError().message);
      }
      // expect(generator.mustGetIdOf({ title: "Todo 0" })).toThrow(new InvalidIdOfError());
    });
  });

  it('should get ID from given entity if present or generate new one', () => {
    [new IncrementingIdGenerator<Todo>('id'), new UUIDGenerator<Todo>('id')].forEach(
      generator => {
        expect(
          generator.getPresentIdOrGenerate({ id: '0', title: 'Todo 0' }, getState())
        ).toBe('0');
        expect(generator.getPresentIdOrGenerate({ title: 'Todo 0' }, getState())).toBeTruthy();
      }
    );

    const entityGenerator = new EntityIdGenerator<Todo>('id');
    expect(
      entityGenerator.getPresentIdOrGenerate({ id: '0', title: 'Todo 0' }, getState())
    ).toBe('0');
    try {
      entityGenerator.getPresentIdOrGenerate({ title: 'Todo 0' }, getState());
    } catch (e) {
      expect(e.message).toBe(new InvalidIdOfError().message);
    }
  });

  describe('IncrementingIdGenerator', () => {
    it('should generate correct IDs from beginning', () => {
      const generator = new IncrementingIdGenerator<Todo>('id');
      const state = getState();
      expect(generator.isIdInState('3', state)).toBe(true); // current highest ID
      expect(generator.generateId(undefined, state)).toBe('4');
      state.ids.push('4'); // use the generated ID
      expect(generator.generateId(undefined, state)).toBe('5');
    });
  });

  describe('UUIDGenerator', () => {
    it('should generate correct UUIDs', () => {
      const generator = new UUIDGenerator<Todo>('id');
      const state = getState(); // while this state doesn't have valid UUIDs, it's not possible to provoke a collision anyways
      const firstId = generator.generateId(undefined, state);
      const secondId = generator.generateId(undefined, state);
      expect(firstId.length).toBe(36);
      expect(secondId.length).toBe(36);
      expect(firstId).not.toEqual(secondId);
    });
  });

  describe('EntityIdGenerator', () => {
    it('should take correct IDs from entities', () => {
      const generator = new EntityIdGenerator<Todo>('id');
      const state = getState();
      expect(
        generator.generateId(
          {
            id: '4',
            title: 'Todo 4'
          },
          state
        )
      ).toBe('4');

      try {
        generator.generateId({ title: 'Todo 0' }, state);
      } catch (e) {
        expect(e.message).toBe(new InvalidIdOfError().message);
      }
      /*expect(generator.generateId({
        title: "Todo 0"
      }, undefined)).toThrow(new InvalidIdOfError());*/
    });
  });
});

interface Todo {
  id: string;
  title: string;
}
