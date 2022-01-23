import { commands, workspace } from 'vscode';
import moment from 'moment';

import openDailyNote from './openDailyNote';
import { closeEditorsAndCleanWorkspace } from '../test/utils';

describe('openDailyNote command', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should not fail on direct call', async () => {
    expect(() => openDailyNote()).not.toThrow();

    await commands.executeCommand('workbench.action.acceptSelectedQuickOpenItem');
  });

  it("should open today's note", async () => {
    const today = moment().format('YYYY-MM-DD');

    openDailyNote();

    await commands.executeCommand('workbench.action.acceptSelectedQuickOpenItem');

    const uris = await workspace.findFiles('**/*.md')!;

    expect(uris).toHaveLength(1);

    expect(uris[0].fsPath.endsWith(`${today}.md`)).toBe(true);
  });

  it("should open tomorrow's note", async () => {
    const tomorrow = moment().add(1, 'day').format('YYYY-MM-DD');

    openDailyNote();

    await commands.executeCommand('workbench.action.quickOpenSelectNext');
    await commands.executeCommand('workbench.action.acceptSelectedQuickOpenItem');

    const uris = await workspace.findFiles('**/*.md')!;

    expect(uris).toHaveLength(1);

    expect(uris[0].fsPath.endsWith(`${tomorrow}.md`)).toBe(true);
  });

  it("should open yesterday's note", async () => {
    const yesterday = moment().add(-1, 'day').format('YYYY-MM-DD');

    openDailyNote();

    await commands.executeCommand('workbench.action.quickOpenSelectNext');
    await commands.executeCommand('workbench.action.quickOpenSelectNext');
    await commands.executeCommand('workbench.action.acceptSelectedQuickOpenItem');

    const uris = await workspace.findFiles('**/*.md')!;

    expect(uris).toHaveLength(1);

    expect(uris[0].fsPath.endsWith(`${yesterday}.md`)).toBe(true);
  });
});
