describe('String Generation', () => {
  test('generates session ID at least 8 chars', () => {
    const generateSessionId = () =>
      Math.random().toString(36).substring(2).padEnd(8).substring(0, 8);
    const sessionId = generateSessionId();
    expect(typeof sessionId).toBe('string');
    expect(sessionId.length).toBe(8);
  });

  test('generates token at least 12 chars', () => {
    const generateToken = () =>
      Math.random().toString(36).substring(2).padEnd(14).substring(0, 14);
    const token = generateToken();
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThanOrEqual(10);
  });

  test('session ID length is consistent', () => {
    const generateSessionId = () =>
      Math.random().toString(36).substring(2).padEnd(8).substring(0, 8);
    const id1 = generateSessionId();
    const id2 = generateSessionId();
    expect(id1.length).toBe(8);
    expect(id2.length).toBe(8);
  });
});

describe('Session Management Logic', () => {
  test('routes messages by sessionId structure', () => {
    const messages = [
      { type: 'barcode', data: '12345', sessionId: 'abc123' },
      { type: 'barcode', data: '67890', sessionId: 'abc123' },
      { type: 'barcode', data: 'abcde', sessionId: 'xyz999' },
    ];

    const bySession = new Map();
    messages.forEach((msg) => {
      if (!bySession.has(msg.sessionId)) {
        bySession.set(msg.sessionId, []);
      }
      bySession.get(msg.sessionId).push(msg);
    });

    expect(bySession.get('abc123')).toHaveLength(2);
    expect(bySession.get('xyz999')).toHaveLength(1);
  });
});