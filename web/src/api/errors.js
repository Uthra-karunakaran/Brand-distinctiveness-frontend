/* Shared so the client and its stub can both raise it without importing each
 * other in a cycle. A 409 carries no job_id, so there is nothing to poll: the
 * caller must keep its own in-flight id and wait for that job instead. */
export class JobInFlightError extends Error {
  constructor(detail) {
    super(detail || "A job is already running for this brand.");
    this.name = "JobInFlightError";
  }
}
