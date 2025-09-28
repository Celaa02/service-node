import { ProjectRepositoryPg } from '../infrastructure/persistence/pg/ProjectRepositoryPg.js';
import logger from '../utils/logger.js';

const repo = new ProjectRepositoryPg();

export async function getProjectStatsService(projectId) {
  const project = await repo.getProjectRepo(projectId);
  if (!project) {
    const err = new Error('Proyecto no encontrado');
    err.status = 404;
    throw err;
  }

  const agg = await repo.getProjectTaskAggRepo(projectId);
  const total = Number(agg.total || 0);
  const done = Number(agg.done || 0);
  const completion_percentage = total ? Number(((done / total) * 100).toFixed(2)) : 0;

  const estimated = Number(agg.total_estimated_hours || 0);
  const actual = Number(agg.total_actual_hours || 0);
  const efficiency_percentage =
    estimated > 0 ? Number(((actual / estimated) * 100).toFixed(2)) : null;

  const top_contributors = await repo.getTopContributorsRepo(projectId, 5);
  logger.info(`Top proyectos: ${top_contributors}`);

  return {
    project,
    tasks: {
      total,
      by_status: {
        pending: Number(agg.pending || 0),
        in_progress: Number(agg.in_progress || 0),
        done: Number(agg.done || 0),
      },
      completion_percentage,
      last_activity: agg.last_activity,
    },
    hours: {
      estimated,
      actual,
      efficiency_percentage,
    },
    top_contributors,
  };
}
