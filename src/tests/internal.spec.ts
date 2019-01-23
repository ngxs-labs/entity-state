import { State } from '@ngxs/store';
import { defaultEntityState, EntityState } from '../lib/entity-state';
import { EntityStateModel } from '../lib/models';
import { IdStrategy } from '../lib/id-strategy';
import {
  elvis,
  generateActionObject,
  getActive,
  mustGetActive,
  NGXS_META_KEY,
  wrapOrClamp
} from '../lib/internal';
import { NoActiveEntityError } from '../lib/errors';

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

describe('internal', () => {
  beforeAll(() => {
    TestState[NGXS_META_KEY].path = 'todo';
  });

  describe('generateActionObject', () => {
    it('should generate an action object with reflected data', () => {
      const obj = generateActionObject('add', TestState, 42);
      const constructor = Reflect.getPrototypeOf(obj).constructor;
      expect('type' in constructor).toBe(true);
      expect(constructor['type']).toBe('[todo] add');
    });

    it('should generate an action object with payload', () => {
      const obj = generateActionObject('add', TestState, 42);
      expect(obj.payload).toBe(42);
    });
  });

  describe('getActive', () => {
    it('should get the active entity', () => {
      const state = defaultEntityState({ active: '0', entities: { '0': { title: '0' } } });
      const active = getActive(state);
      expect(active).toEqual({ title: '0' });
    });
  });

  describe('wrapOrClamp', () => {
    it('should clamp between two values, if wrap is false', () => {
      expect(wrapOrClamp(false, 5, 0, 10)).toBe(5);
      expect(wrapOrClamp(false, 15, 0, 10)).toBe(10);
      expect(wrapOrClamp(false, -5, 0, 10)).toBe(0);
    });

    it('should wrap around, if wrap is true', () => {
      expect(wrapOrClamp(true, 5, 0, 10)).toBe(5);
      expect(wrapOrClamp(true, 15, 0, 10)).toBe(0);
      expect(wrapOrClamp(true, -5, 0, 10)).toBe(10);
    });
  });

  describe('elvis', () => {
    it('should find nested properties', () => {
      const input = { a: { b: { c: 'Test' } } };
      const result = elvis(input, 'a.b.c');
      expect(result).toBe('Test');
    });

    it('should be undefined safe', () => {
      const input = { a: { b: { c: 'Test' } } };
      const result = elvis(input, 'a.bc');
      expect(result).toBeUndefined();

      expect(elvis(undefined, 'a.b.c')).toBeUndefined();
    });
  });

  describe('mustGetActive', () => {
    it('should return present ID without error', () => {
      const state = defaultEntityState({ active: '0', entities: { '0': { title: '0' } } });
      const active = mustGetActive(state);
      expect(active).toEqual({
        id: '0',
        active: { title: '0' }
      });
    });

    it('should throw an error on undefined ID', () => {
      const state = defaultEntityState();
      try {
        mustGetActive(state);
      } catch (e) {
        expect(e.message).toBe(new NoActiveEntityError().message);
      }
    });
  });
});
