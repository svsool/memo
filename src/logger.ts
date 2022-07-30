import { window } from 'vscode';
import util from 'util';

export const logger = window.createOutputChannel('Memo');

const createLogFn =
  (level: string) =>
  (...params: (string | object | unknown)[]) =>
    logger.appendLine(
      `[${new Date().toISOString()}] [${level}] ${params
        .map((param) => (typeof param === 'string' ? param : util.inspect(param)))
        .join(' ')}`,
    );

const info = createLogFn('info');

const debug = createLogFn('debug');

const warn = createLogFn('warn');

const error = createLogFn('error');

export default { info, warn, debug, error, logger };
