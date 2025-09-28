import { jest } from '@jest/globals';

const query = jest.fn();
jest.unstable_mockModule('../../../../src/config/database.js', () => ({
  query,
}));

const { ProjectRepositoryPg } = await import(
  '../../../../src/infrastructure/persistence/pg/ProjectRepositoryPg.js'
);

describe('ProjectRepositoryPg', () => {
  let repo;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new ProjectRepositoryPg();
  });

  describe('getProjectRepo', () => {
    it('devuelve la primera fila cuando existe el proyecto', async () => {
      const projectId = '650e8400-e29b-41d4-a716-446655440001';
      const row = {
        id: projectId,
        name: 'Plataforma E-Learning',
        status: 'active',
        start_date: '2024-01-15T00:00:00.000Z',
        end_date: null,
        owner_id: 'u1',
      };
      query.mockResolvedValueOnce({ rows: [row] });

      const out = await repo.getProjectRepo(projectId);

      expect(query).toHaveBeenCalledTimes(1);
      // SQL básico y parámetros
      expect(query.mock.calls[0][0]).toMatch(/FROM projects p\s+WHERE p\.id = \$1/i);
      expect(query.mock.calls[0][1]).toEqual([projectId]);

      expect(out).toEqual(row);
    });

    it('devuelve null si no hay resultados', async () => {
      query.mockResolvedValueOnce({ rows: [] });

      const out = await repo.getProjectRepo('non-existent');
      expect(out).toBeNull();
    });
  });

  describe('getProjectTaskAggRepo', () => {
    it('retorna el objeto de agregados de tareas del proyecto', async () => {
      const projectId = '650e8400-e29b-41d4-a716-446655440002';
      const agg = {
        total: 10,
        pending: 3,
        in_progress: 4,
        done: 3,
        total_estimated_hours: '120.00',
        total_actual_hours: '90.00',
        last_activity: '2025-09-28T10:00:00.000Z',
      };
      query.mockResolvedValueOnce({ rows: [agg] });

      const out = await repo.getProjectTaskAggRepo(projectId);

      expect(query).toHaveBeenCalledTimes(1);
      const sql = query.mock.calls[0][0];
      expect(sql).toMatch(/FROM tasks\s+WHERE project_id = \$1/i);
      expect(sql).toMatch(/COUNT\(\*\)::int AS total/i);
      expect(sql).toMatch(/FILTER \(WHERE status = 'pending'\)/i);
      expect(sql).toMatch(/FILTER \(WHERE status = 'in_progress'\)/i);
      expect(sql).toMatch(/FILTER \(WHERE status = 'done'\)/i);
      expect(sql).toMatch(
        /COALESCE\(SUM\(estimated_hours\), 0\)::numeric AS total_estimated_hours/i,
      );
      expect(sql).toMatch(/COALESCE\(SUM\(actual_hours\), 0\)::numeric AS total_actual_hours/i);
      expect(sql).toMatch(/MAX\(updated_at\) AS last_activity/i);
      expect(query.mock.calls[0][1]).toEqual([projectId]);

      expect(out).toEqual(agg);
    });
  });

  describe('getTopContributorsRepo', () => {
    it('usa limit=5 por defecto y devuelve las filas', async () => {
      const projectId = '650e8400-e29b-41d4-a716-446655440003';
      const rows = [
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
      query.mockResolvedValueOnce({ rows });

      const out = await repo.getTopContributorsRepo(projectId);

      expect(query).toHaveBeenCalledTimes(1);
      const sql = query.mock.calls[0][0];
      // Verifica la forma de la query *actual*
      expect(sql).toMatch(/FROM tasks t\s+JOIN users u ON u\.id = t\.id/i);
      expect(sql).toMatch(/WHERE t\.id = \$1 AND t\.status = 'done'/i);
      expect(sql).toMatch(/ORDER BY completed_tasks DESC\s+LIMIT \$2/i);

      // Parám. por defecto: limit=5
      expect(query.mock.calls[0][1]).toEqual([projectId, 5]);
      expect(out).toEqual(rows);
    });

    it('respeta el limit provisto', async () => {
      const projectId = '650e8400-e29b-41d4-a716-446655440004';
      query.mockResolvedValueOnce({ rows: [] });

      await repo.getTopContributorsRepo(projectId, 10);

      expect(query.mock.calls[0][1]).toEqual([projectId, 10]);
    });
  });
});
