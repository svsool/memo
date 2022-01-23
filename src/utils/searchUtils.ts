import fs from 'fs-extra';
import * as vscode from 'vscode';
import { execa, ExecaError } from 'execa';
import path from 'path';

import { escapeForRegExp } from './utils';
import logger from '../logger';

let ripgrepPathGlobal: string | undefined | false;

const findRipgrepPath = async (): Promise<string | undefined> => {
  if (ripgrepPathGlobal) {
    return ripgrepPathGlobal;
  }

  const name = /^win/.test(process.platform) ? 'rg.exe' : 'rg';
  const vscodePath = vscode.env.appRoot;

  const ripgrepPaths = [
    name,
    path.join(vscodePath, `node_modules.asar.unpacked/vscode-ripgrep/bin/${name}`),
    path.join(vscodePath, `node_modules/vscode-ripgrep/bin/${name}`),
  ];

  for (const ripgrepPath of ripgrepPaths) {
    try {
      logger.info(`Trying ripgrep at path "${ripgrepPath}"`);

      await execa(ripgrepPath, ['--version']);

      ripgrepPathGlobal = ripgrepPath;

      logger.info(`Ripgrep detected at path "${ripgrepPath}"`);

      return ripgrepPath;
    } catch (e) {
      logger.warn(`No rigrep bin found at path "${ripgrepPath}"`);
    }
  }

  logger.warn('No rigrep bin detected!');

  ripgrepPathGlobal = false;

  return;
};

export const refsToSearchRegExpStr = (refs: string[]) => `(${refs.map(escapeForRegExp).join('|')})`;

export const search = async (regExpStr: string, dirPath: string = '.'): Promise<string[]> => {
  const ripgrepPath = await findRipgrepPath();

  if (!ripgrepPath || !regExpStr) {
    return [];
  }

  try {
    const res = await execa(ripgrepPath, [
      '-l',
      '--ignore-case',
      '--color',
      'never',
      '-g',
      `*.md`,
      regExpStr,
      dirPath,
    ]);

    const paths = res.stdout
      .toString()
      .split(/\r?\n/g)
      .filter((path) => path);

    if (paths.length && (await fs.pathExists(paths[0]))) {
      return paths;
    }
  } catch (e) {
    if ((e as ExecaError).exitCode !== 1) {
      console.error(e);
    }
  }

  return [];
};
