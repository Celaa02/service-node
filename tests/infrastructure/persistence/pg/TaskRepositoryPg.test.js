import { jest } from '@jest/globals';

const query = jest.fn();
jest.unstable_mockModule('../../../../src/config/database.js', () => ({ query }));

jest.unstable_mockModule('.../../../../src/domain/repositories/TaskRepository.js', () => ({
  TaskRepository: class {},
}));

const { TaskRepositoryPg } = await import(
  '../../../../src/infrastructure/persistence/pg/TaskRepositoryPg.js'
);

describe('TaskRepositoryPg', () => {
  let repo;
  beforeEach(() => {
    jest.clearAllMocks();
    repo = new TaskRepositoryPg();
  });

  describe('create', () => {
    it('inserta con defaults y retorna la fila creada', async () => {
      const inserted = {
        id: 't1',
        title: 'Nueva tarea',
        description: null,
        project_id: 'p1',
        assigned_to: 'u2',
        created_by: 'u2',
        priority: 'medium',
        due_date: null,
        estimated_hours: null,
      };
      query.mockResolvedValueOnce({ rows: [inserted] });

      const out = await repo.create({
        title: 'Nueva tarea',
        project_id: 'p1',
        created_by: 'u2',
      });

      expect(query).toHaveBeenCalledTimes(1);
      const [sql, params] = query.mock.calls[0];
      expect(sql).toMatch(
        /INSERT INTO tasks\s*\(title, description, project_id, assigned_to, created_by, priority, due_date, estimated_hours\)/i,
      );
      expect(params).toEqual(['Nueva tarea', null, 'p1', 'u2', 'u2', 'medium', null, null]);
      expect(out).toEqual(inserted);
    });
  });

  describe('list', () => {
    it('construye filtros, orden y paginación (ORDER BY por whitelist) y retorna total/items', async () => {
      const rows = [
        {
          total: 2,
          items: [
            { id: 't2', title: 'B', priority: 'high' },
            { id: 't1', title: 'A', priority: 'high' },
          ],
        },
      ];
      query.mockResolvedValueOnce({ rows });

      const result = await repo.list({
        limit: 10,
        offset: 20,
        status: 'pending',
        priority: 'high',
        assigned_to: 'u1',
        project_id: 'p1',
        sort_by: 'priority',
        order: 'asc',
      });

      expect(query).toHaveBeenCalledTimes(1);
      const [sql, params] = query.mock.calls[0];

      expect(sql).toMatch(
        /WHERE\s+t\.status = \$1\s+AND t\.priority = \$2\s+AND t\.assigned_to = \$3\s+AND t\.project_id = \$4/i,
      );
      expect(sql).toMatch(/ORDER BY\s+priority\s+ASC/i);
      expect(sql).toMatch(/OFFSET \$5 LIMIT \$6/i);
      expect(params).toEqual(['pending', 'high', 'u1', 'p1', 20, 10]);

      expect(result).toEqual({
        total: 2,
        items: rows[0].items,
      });
    });

    it('sin filtros usa ORDER BY created_at DESC y OFFSET/LIMIT como $1 y $2', async () => {
      query.mockResolvedValueOnce({ rows: [{ total: 0, items: null }] });
      const res = await repo.list({ limit: 10, offset: 0 });

      const [sql, params] = query.mock.calls[0];
      expect(sql).toMatch(/ORDER BY\s+created_at\s+DESC/i);
      expect(sql).toMatch(/OFFSET \$1 LIMIT \$2/i);
      expect(params).toEqual([0, 10]);
      expect(res).toEqual({ total: 0, items: [] });
    });
  });

  describe('getById', () => {
    it('retorna null si no existe la tarea', async () => {
      query.mockResolvedValueOnce({ rows: [] });
      const out = await repo.getById('t404');
      expect(out).toBeNull();
      expect(query).toHaveBeenCalledTimes(1);
    });

    // it('retorna la tarea con comentarios cuando existe', async () => {
    //   const taskRow = {
    //     id: 't1',
    //     title: 'X',
    //     assigned_to: 'u1',
    //     assigned_username: 'sofia',
    //     created_by_username: 'admin',
    //     project_name: 'Demo',
    //   };
    //   const comments = [
    //     { id: 'c1', task_id: 't1', user_id: 'u1', content: 'hola', username: 'sofia' },
    //     { id: 'c2', task_id: 't1', user_id: 'u2', content: 'mundo', username: 'carlos' },
    //   ];
    //   query.mockResolvedValueOnce({ rows: [taskRow] }).mockResolvedValueOnce({ rows: comments });

    //   const out = await repo.getById('t1');

    //   expect(query).toHaveBeenCalledTimes(2);
    //   expect(query.mock.calls[0][0]).toMatch(
    //     /FROM tasks t\s+LEFT JOIN users u1.*LEFT JOIN users u2.*LEFT JOIN projects p/i
    //   );
    //   expect(query.mock.calls[0][1]).toEqual(['t1']);
    //   expect(query.mock.calls[1][0]).toMatch(
    //     /FROM task_comments tc JOIN users u ON tc\.user_id = u\.id/i
    //   );
    //   expect(query.mock.calls[1][1]).toEqual(['t1']);

    //   expect(out).toEqual({ ...taskRow, comments });
    // });
  });

  describe('update', () => {
    it('cuando status pasa a completed y no hay completed_at, lo setea automáticamente y hace updated_at = now()', async () => {
      const updated = { id: 't1', status: 'completed', title: 'Nuevo título' };
      query.mockResolvedValueOnce({ rows: [updated] });

      const patch = { status: 'completed', title: 'Nuevo título' };
      const out = await repo.update('t1', patch);

      expect(query).toHaveBeenCalledTimes(1);
      const [sql, params] = query.mock.calls[0];

      expect(sql).toMatch(/SET .*updated_at = now\(\)/is);

      expect(params[0]).toBe('completed');
      expect(params[1]).toBe('Nuevo título');
      expect(params.some((p) => p instanceof Date)).toBe(true);
      expect(params.at(-1)).toBe('t1');

      expect(out).toEqual(updated);
    });

    it('retorna null si no actualiza filas', async () => {
      query.mockResolvedValueOnce({ rows: [] });
      const out = await repo.update('t404', { title: 'nada' });
      expect(out).toBeNull();
    });
  });

  describe('remove', () => {
    it('borra y retorna la fila', async () => {
      const row = { id: 't1', title: 'X' };
      query.mockResolvedValueOnce({ rows: [row] });

      const out = await repo.remove('t1');
      expect(query).toHaveBeenCalledWith('DELETE FROM tasks WHERE id = $1 RETURNING *;', ['t1']);
      expect(out).toEqual(row);
    });

    it('retorna null si no encuentra la fila', async () => {
      query.mockResolvedValueOnce({ rows: [] });
      const out = await repo.remove('t404');
      expect(out).toBeNull();
    });
  });

  describe('addComment', () => {
    it('inserta comentario y retorna la fila', async () => {
      const row = { id: 'c1', task_id: 't1', user_id: 'u1', content: 'hola' };
      query.mockResolvedValueOnce({ rows: [row] });

      const out = await repo.addComment('t1', 'u1', 'hola');

      expect(query).toHaveBeenCalledWith(
        expect.stringMatching(
          /INSERT INTO task_comments \(task_id, user_id, content\)\s+VALUES \(\$1,\$2,\$3\) RETURNING \*/i,
        ),
        ['t1', 'u1', 'hola'],
      );
      expect(out).toEqual(row);
    });
  });
});
