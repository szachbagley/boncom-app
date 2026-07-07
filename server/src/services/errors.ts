/** A referenced entity (e.g. a client) does not exist. Maps to 404 at the route layer. */
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/** A business-rule violation (invalid discount, invalid status transition). Maps to 400. */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
