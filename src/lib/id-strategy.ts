import { EntityStateModel } from './models';
import { InvalidIdOfError, UnableToGenerateIdError } from './errors';

export namespace IdStrategy {
  export abstract class IdGenerator<T> {
    protected constructor(protected readonly idKey: keyof T) {}

    /**
     * Generates a completely new ID.
     * The IdGenerator's implementation has to ensure that the generated ID does not exist in the current state.
     * It can throw an UnableToGenerateIdError if it's unable to do so.
     * @param entity The entity to generate an ID for
     * @param state The current state
     * @see getPresentIdOrGenerate
     * @see UnableToGenerateIdError
     */
    abstract generateId(entity: Partial<T>, state: EntityStateModel<any>): string;

    /**
     * Checks if the given id is in the state's ID array
     * @param id the ID to check
     * @param state the current state
     */
    isIdInState(id: string, state: EntityStateModel<any>): boolean {
      return state.ids.includes(id);
    }

    /**
     * This function tries to get the present ID of the given entity with #getIdOf.
     * If it's undefined the #generateId function will be used.
     * @param entity The entity to get the ID from
     * @param state The current state
     * @see getIdOf
     * @see generateId
     */
    getPresentIdOrGenerate(entity: Partial<T>, state: EntityStateModel<any>): string {
      const presentId = this.getIdOf(entity);
      return presentId === undefined ? this.generateId(entity, state) : presentId;
    }

    /**
     * A wrapper for #getIdOf. If the function returns undefined an error will be thrown.
     * @param entity The entity to get the ID from
     * @see getIdOf
     * @see InvalidIdOfError
     */
    mustGetIdOf(entity: any): string {
      const id = this.getIdOf(entity);
      if (id === undefined) {
        throw new InvalidIdOfError();
      }
      return id;
    }

    /**
     * Returns the ID for the given entity. Can return undefined.
     * @param entity The entity to get the ID from
     */
    getIdOf(entity: any): string | undefined {
      return entity[this.idKey];
    }
  }

  export class IncrementingIdGenerator<T> extends IdGenerator<T> {
    constructor(idKey: keyof T) {
      super(idKey);
    }

    generateId(entity: Partial<T>, state: EntityStateModel<any>): string {
      const max = Math.max(-1, ...state.ids.map(id => parseInt(id, 10)));
      return (max + 1).toString(10);
    }
  }

  export class UUIDGenerator<T> extends IdGenerator<T> {
    constructor(idKey: keyof T) {
      super(idKey);
    }

    generateId(entity: Partial<T>, state: EntityStateModel<any>): string {
      let nextId;
      do {
        nextId = this.uuidv4();
      } while (this.isIdInState(nextId, state));
      return nextId;
    }

    private uuidv4(): string {
      // https://stackoverflow.com/a/2117523
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = (Math.random() * 16) | 0; // tslint:disable-line
        const v = c === 'x' ? r : (r & 0x3) | 0x8; // tslint:disable-line
        return v.toString(16);
      });
    }
  }

  export class EntityIdGenerator<T> extends IdGenerator<T> {
    constructor(idKey: keyof T) {
      super(idKey);
    }

    generateId(entity: Partial<T>, state: EntityStateModel<any>): string {
      const id = this.mustGetIdOf(entity);
      if (this.isIdInState(id, state)) {
        throw new UnableToGenerateIdError(`The provided ID already exists: ${id}`);
      }
      return id;
    }
  }
}
