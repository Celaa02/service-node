/**
 * @typedef {Object} Pagination
 * @property {number} [limit]
 * @property {number} [offset]
 */

/**
 * @typedef {Object} DateRange
 * @property {string|null} [start]
 * @property {string|null} [end]
 */

/**
 * @typedef {Object} UserRankingParams
 * @property {string|null} [start]
 * @property {string|null} [end]
 * @property {number} [limit]
 * @property {number} [offset]
 */

/**
 * @typedef {Object} ProductivityParams
 * @property {string|null} [start]
 * @property {string|null} [end]
 * @property {number} [limit]
 * @property {number} [offset]
 */

/**
 * @typedef {Object} ProjectReportParams
 * @property {('draft'|'active'|'paused'|'archived')|string} [status]
 * @property {string} [ownerId]  UUID
 */

/**
 * @typedef {Object} ProjectTimelineParams
 * @property {string} [projectId]  UUID
 * @property {string|null} [start]
 * @property {string|null} [end]
 */

/**
 * @typedef {Object} WorkloadParams
 * @property {('user'|'project')} [scope]
 * @property {('pending'|'in_progress'|'completed')|string|null} [status]
 */

/**
 * @typedef {Object} ExportParams
 * @property {('productivity'|'projects'|'time'|'tasks')} type
 * @property {string|null} [start]
 * @property {string|null} [end]
 */

/**
 * @interface ReportRepository
 * Métodos que debe implementar cualquier repositorio de reports.
 */
export class ReportRepository {
  /** @returns {Promise<{total_users:number,total_projects:number,total_tasks:number,completed_tasks:number}>} */
  getDashboardStats() {
    throw new Error('Not implemented');
  }

  /** @param {ProductivityParams} _params @returns {Promise<{total:number,items:any[]}>} */
  getUserProductivity() {
    throw new Error('Not implemented');
  }

  /** @param {UserRankingParams} _params @returns {Promise<{total:number,items:any[]}>} */
  getUserRanking() {
    throw new Error('Not implemented');
  }

  /** @param {ProjectReportParams} _params @returns {Promise<any[]>} */
  getProjectReport() {
    throw new Error('Not implemented');
  }

  /** @param {ProjectTimelineParams} _params @returns {Promise<any[]>} */
  getProjectTimeline() {
    throw new Error('Not implemented');
  }

  /** @param {WorkloadParams} _params @returns {Promise<any[]>} */
  getWorkloadDistribution() {
    throw new Error('Not implemented');
  }

  /** @param {ExportParams} _params @returns {Promise<any[]>} */
  exportData() {
    throw new Error('Not implemented');
  }

  /** @param {Array<Object>} _rows @param {string} _userId @param {import('pg').PoolClient} _client @returns {Promise<number>} */
  importTasksBatch() {
    throw new Error('Not implemented');
  }
}
