const { toCSV } = await import('../../src/utils/toCSV.js');

describe('toCSV', () => {
  test('retorna cadena vacía si rows es undefined/null o []', () => {
    expect(toCSV()).toBe('');
    expect(toCSV(null)).toBe('');
    expect(toCSV([])).toBe('');
  });

  test('usa las claves del PRIMER objeto como headers y mantiene su orden', () => {
    const rows = [
      { b: 'B1', a: 'A1' },
      { b: 'B2', a: 'A2' },
    ];
    const out = toCSV(rows);
    expect(out).toBe('b,a\nB1,A1\nB2,A2');
  });

  test('convierte numbers y booleans a string', () => {
    const rows = [
      { n: 42, ok: true },
      { n: 0, ok: false },
    ];
    const out = toCSV(rows);
    expect(out).toBe('n,ok\n42,true\n0,false');
  });

  test('null/undefined -> celda vacía', () => {
    const rows = [
      { a: null, b: undefined },
      { a: 'x', b: 'y' },
    ];
    const out = toCSV(rows);
    expect(out).toBe('a,b\n,\nx,y');
  });

  test('escapa comillas, comas y saltos de línea correctamente', () => {
    const rows = [
      { text: 'hola, mundo' },
      { text: 'dijo "hola"' },
      { text: 'multi\nlinea' },
      { text: 'mi, "csv"\nchévere' },
    ];
    const out = toCSV(rows);
    expect(out).toBe(
      'text\n' +
        '"hola, mundo"\n' +
        '"dijo ""hola"""\n' +
        '"multi\nlinea"\n' +
        '"mi, ""csv""\nchévere"',
    );
  });

  test('celdas extra en filas siguientes se ignoran (solo headers del primer objeto)', () => {
    const rows = [
      { a: 1, b: 2 },
      { a: 3, b: 4, c: 5 },
    ];
    const out = toCSV(rows);
    expect(out).toBe('a,b\n1,2\n3,4');
  });

  test('si al 2º objeto le falta una clave del header, queda celda vacía en esa posición', () => {
    const rows = [{ a: 'A1', b: 'B1' }, { a: 'A2' }];
    const out = toCSV(rows);
    expect(out).toBe('a,b\nA1,B1\nA2,');
  });

  test('no añade salto de línea al final del CSV', () => {
    const rows = [{ a: 'x' }, { a: 'y' }];
    const out = toCSV(rows);
    expect(out.endsWith('\n')).toBe(false);
    expect(out).toBe('a\nx\ny');
  });
});
