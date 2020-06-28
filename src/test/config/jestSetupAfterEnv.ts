process.env.NODE_ENV = 'test';
jest.mock('vscode', () => (global as any).vscode, { virtual: true });
