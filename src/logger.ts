import { window } from 'vscode';
import util from 'util';

export const logger = window.createOutputChannel('Memo');

const info = (str: string) => logger.appendLine(`[INFO] ${str}`);

const warn = (str: string) => logger.appendLine(`[WARN] ${str}`);

const error = (str: string | unknown) =>
  logger.appendLine(`[ERROR] ${typeof str === 'string' ? str : util.inspect(str)}`);

export default { info, warn, error };
