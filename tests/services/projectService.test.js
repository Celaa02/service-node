import { jest } from '@jest/globals';

const loggerInfo = jest.fn();
jest.unstable_mockModule('../../src/utils/logger.js', () => ({
  default: { info: loggerInfo },
}));

const mockRepoInstance = {
  getProjectRepo: jest.fn(),
  getProjectTaskAggRepo: jest.fn(),
  getTopContributorsRepo: jest.fn(),
};
const ProjectRepositoryPgMock = jest.fn(() => mockRepoInstance);

jest.unstable_mockModule('../../src/infrastructure/persistence/pg/ProjectRepositoryPg.js', () => ({
  ProjectRepositoryPg: ProjectRepositoryPgMock,
}));

const { getProjectStatsService } = await import('../../src/services/projectService.js');

describe('getProjectStatsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('retorna stats calculadas cuando el proyecto existe', async () => {
    const projectId = '650e8400-e29b-41d4-a716-446655440001';

    mockRepoInstance.getProjectRepo.mockResolvedValue({
      id: projectId,
      name: 'Plataforma E-Learning',
      status: 'active',
      start_date: '2024-01-15T00:00:00.000Z',
    });

    mockRepoInstance.getProjectTaskAggRepo.mockResolvedValue({
      total: '10',
      done: '4',
      pending: '3',
      in_progress: '3',
      total_estimated_hours: '120',
      total_actual_hours: '90',
      last_activity: '2025-09-28T10:00:00.000Z',
    });

    const top = [
      {
        user_id: 'u1',
        username: 'sofia',
        first_name: 'Sofia',
        last_name: 'Gómez',
        completed_tasks: 5,
      },
      {
        user_id: 'u2',
        username: 'carlos',
        first_name: 'Carlos',
        last_name: 'López',
        completed_tasks: 3,
      },
    ];
    mockRepoInstance.getTopContributorsRepo.mockResolvedValue(top);

    const result = await getProjectStatsService(projectId);

    expect(ProjectRepositoryPgMock).toHaveBeenCalledTimes(0);
    expect(mockRepoInstance.getProjectRepo).toHaveBeenCalledWith(projectId);
    expect(mockRepoInstance.getProjectTaskAggRepo).toHaveBeenCalledWith(projectId);
    expect(mockRepoInstance.getTopContributorsRepo).toHaveBeenCalledWith(projectId, 5);

    expect(result.project).toEqual(
      expect.objectContaining({ id: projectId, name: 'Plataforma E-Learning', status: 'active' }),
    );

    expect(result.tasks).toEqual({
      total: 10,
      by_status: { pending: 3, in_progress: 3, done: 4 },
      completion_percentage: 40,
      last_activity: '2025-09-28T10:00:00.000Z',
    });

    expect(result.hours).toEqual({
      estimated: 120,
      actual: 90,
      efficiency_percentage: 75,
    });

    expect(result.top_contributors).toEqual(top);

    expect(loggerInfo).toHaveBeenCalledTimes(1);
    expect(loggerInfo).toHaveBeenCalledWith(expect.stringContaining('Top proyectos:'));
  });

  it('lanza 404 si el proyecto no existe', async () => {
    const projectId = '650e8400-e29b-41d4-a716-44665544ffff';
    mockRepoInstance.getProjectRepo.mockResolvedValue(null);

    await expect(getProjectStatsService(projectId)).rejects.toMatchObject({
      status: 404,
      message: 'Proyecto no encontrado',
    });

    expect(mockRepoInstance.getProjectTaskAggRepo).not.toHaveBeenCalled();
    expect(mockRepoInstance.getTopContributorsRepo).not.toHaveBeenCalled();
    expect(loggerInfo).not.toHaveBeenCalled();
  });

  it('efficiency_percentage es null si estimated es 0 (evita división por cero)', async () => {
    const projectId = '650e8400-e29b-41d4-a716-446655440002';

    mockRepoInstance.getProjectRepo.mockResolvedValue({
      id: projectId,
      name: 'Demo',
      status: 'active',
    });

    mockRepoInstance.getProjectTaskAggRepo.mockResolvedValue({
      total: 5,
      done: 2,
      pending: 2,
      in_progress: 1,
      total_estimated_hours: 0,
      total_actual_hours: 17,
      last_activity: '2025-09-28T10:30:00.000Z',
    });

    mockRepoInstance.getTopContributorsRepo.mockResolvedValue([]);

    const result = await getProjectStatsService(projectId);

    expect(result.tasks.completion_percentage).toBe(40);
    expect(result.hours.estimated).toBe(0);
    expect(result.hours.actual).toBe(17);
    expect(result.hours.efficiency_percentage).toBeNull();
  });

  it('completion_percentage es 0 si total=0', async () => {
    const projectId = '650e8400-e29b-41d4-a716-446655440003';

    mockRepoInstance.getProjectRepo.mockResolvedValue({
      id: projectId,
      name: 'Vacío',
      status: 'active',
    });
    mockRepoInstance.getProjectTaskAggRepo.mockResolvedValue({
      total: 0,
      done: 0,
      pending: 0,
      in_progress: 0,
      total_estimated_hours: 0,
      total_actual_hours: 0,
      last_activity: null,
    });
    mockRepoInstance.getTopContributorsRepo.mockResolvedValue([]);

    const result = await getProjectStatsService(projectId);

    expect(result.tasks.total).toBe(0);
    expect(result.tasks.by_status).toEqual({ pending: 0, in_progress: 0, done: 0 });
    expect(result.tasks.completion_percentage).toBe(0);
  });
});
