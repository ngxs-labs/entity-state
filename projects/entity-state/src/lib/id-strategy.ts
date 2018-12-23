import { EntityStateModel } from './entity-state';
import { InvalidIdOfError, ProvidedIdAlreadyExistsError } from './errors';

export namespace IdStrategy {
  export abstract class IdGenerator<T> {
    protected constructor(protected readonly idKey: keyof T) {}

    abstract generateId(entity: Partial<T>, state: EntityStateModel<any>): string;

    isIdInState(id: string, state: EntityStateModel<any>): boolean {
      return state.ids.includes(id);
    }

    getPresentIdOrGenerate(entity: Partial<T>, state: EntityStateModel<any>): string {
      const presentId = this.getIdOf(entity);
      return presentId === undefined ? this.generateId(entity, state) : presentId;
    }

    mustGetIdOf(entity: any): string {
      const id = this.getIdOf(entity);
      if (id === undefined) {
        throw new InvalidIdOfError();
      }
      return id;
    }

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
        throw new ProvidedIdAlreadyExistsError(id);
      }
      return id;
    }
  }
}
