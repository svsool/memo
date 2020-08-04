jest.mock('open');
jest.mock('vscode', () => (global as any).vscode, { virtual: true });
jest.mock('lodash.debounce', () => (fn: Function) => fn);
