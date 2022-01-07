import { window } from 'vscode';
import util from 'util';

export const logger = window.createOutputChannel('Memo');

const log =
  (level: string) =>
  (...params: (string | object | unknown)[]) =>
    logger.appendLine(
      `[${new Date().toISOString()}] [${level}] ${params
        .map((param) => (typeof param === 'string' ? param : util.inspect(param)))
        .join(' ')}`,
    );

const info = log('info');

const debug = log('debug');

const warn = log('warn');

const error = log('error');

export default { info, warn, debug, error, logger };
