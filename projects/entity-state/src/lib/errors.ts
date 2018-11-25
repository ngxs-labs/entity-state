export class EntityStateError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class NoActiveEntityError extends EntityStateError {
  constructor(additionalInformation: string = "") {
    super(("No active entity to affect. " + additionalInformation).trim());
  }
}

export class NoSuchEntityError extends EntityStateError {
  constructor(additionalInformation: string = "") {
    super(("No such entity found. " + additionalInformation).trim());
  }
}

export class InvalidIdError extends EntityStateError {
  constructor(passedId: string, calculatedId: string) {
    super(`Unable to use passed or calculated ID. Passed: ${passedId}, idOf(entity): ${calculatedId}`);
  }
}
