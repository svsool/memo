jest.mock('open');
jest.mock('vscode', () => (global as any).vscode, { virtual: true });
