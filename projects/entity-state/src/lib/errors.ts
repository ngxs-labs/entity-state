export class EntityStateError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class NoActiveEntityError extends EntityStateError {
  constructor(additionalInformation: string = '') {
    super(('No active entity to affect. ' + additionalInformation).trim());
  }
}

export class NoSuchEntityError extends EntityStateError {
  constructor(additionalInformation: string = '') {
    super(('No such entity found. ' + additionalInformation).trim());
  }
}

export class InvalidIdError extends EntityStateError {
  constructor(passedId: string, calculatedId: string) {
    super(`Unable to use passed or calculated ID. Passed: ${passedId}, idOf(entity): ${calculatedId}`);
  }
}

export class InvalidIdOfError extends EntityStateError {
  constructor() {
    super(`idOf returned undefined`);
  }
}

export class ProvidedIdAlreadyExistsError extends Error {
  constructor(providedId: string) {
    super(`The provided ID already exists: ${providedId}`);
  }
}

export class UnreachableCaseError extends Error {
  constructor(val: never) {
    super(`Unreachable case: ${val}`);
  }
}
