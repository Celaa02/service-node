/**
 * @typedef {Object} ListParams
 * @property {number} limit
 * @property {number} offset
 * @property {string} [status]
 * @property {string} [priority]
 * @property {string} [assigned_to]
 * @property {string} [project_id]
 * @property {string} sort_by
 * @property {'ASC'|'DESC'} order
 */
export class TaskRepository {
  /** @param {Object} _input */
  create() {
    throw new Error('Not implemented');
  }
  /** @param {ListParams} _p */
  list() {
    throw new Error('Not implemented');
  }
  /** @param {string} _id */
  getById() {
    throw new Error('Not implemented');
  }
  /** @param {string} _id, @param {Object} _patch */
  update() {
    throw new Error('Not implemented');
  }
  /** @param {string} _id */
  remove() {
    throw new Error('Not implemented');
  }
  /** @param {string} _taskId, @param {string} _userId, @param {string} _content */
  addComment() {
    throw new Error('Not implemented');
  }
}
