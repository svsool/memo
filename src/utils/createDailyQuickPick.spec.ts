import moment from 'moment';

import createDailyQuickPick from './createDailyQuickPick';
import { closeEditorsAndCleanWorkspace, createFile } from '../test/testUtils';

describe('createDailyQuickPick()', () => {
  beforeEach(closeEditorsAndCleanWorkspace);

  afterEach(closeEditorsAndCleanWorkspace);

  it('should not fail on call', async () => {
    expect(createDailyQuickPick).not.toThrow();
  });

  it.each(['Today', 'Yesterday', 'Tomorrow'])(
    'should contain %s in the item label',
    (labelSubstr) => {
      const dailyQuickPick = createDailyQuickPick();

      expect(dailyQuickPick.items.some((item) => item.label.includes(labelSubstr))).toBe(true);
    },
  );

  it('should return 60 items (days) + 1 day (today)', () => {
    const dailyQuickPick = createDailyQuickPick();

    expect(dailyQuickPick.items).toHaveLength(63);
  });

  it('should contain an item with an indicator about note existence', async () => {
    const dateInYYYYMMDDFormat = moment().format('YYYY-MM-DD');

    await createFile(`${dateInYYYYMMDDFormat}.md`);

    const dailyQuickPick = createDailyQuickPick();

    const quickPickItem = dailyQuickPick.items.find((item) => item.description === 'Exists')!;

    expect(quickPickItem).not.toBeFalsy();

    expect([...quickPickItem.label][0]).toMatchInlineSnapshot(`"✓"`);
  });

  it('should return all items with an indicator about missing note', async () => {
    const dailyQuickPick = createDailyQuickPick();

    expect(dailyQuickPick.items.every((item) => item.description === 'Missing')).toBe(true);

    expect([...dailyQuickPick.items[0].label][0]).toMatchInlineSnapshot(`"✕"`);
  });

  it('should be able to provide items older than one month', async () => {
    await createFile('2000-01-01.md');
    await createFile('2000-01-02.md');
    await createFile('2000-01-03.md');

    const dailyQuickPick = createDailyQuickPick();

    const item1 = dailyQuickPick.items.find((item) => item.detail === '2000-01-01')!;
    const item2 = dailyQuickPick.items.find((item) => item.detail === '2000-01-02')!;
    const item3 = dailyQuickPick.items.find((item) => item.detail === '2000-01-03')!;

    expect(dailyQuickPick.items).toHaveLength(66);

    expect(item1).not.toBeFalsy();
    expect(item2).not.toBeFalsy();
    expect(item3).not.toBeFalsy();
  });

  it('should be able to provide items newer than one month', async () => {
    const now = moment();

    const note1 = `${now.clone().add(60, 'days').format('YYYY-MM-DD')}`;
    const note2 = `${now.clone().add(61, 'days').format('YYYY-MM-DD')}`;
    const note3 = `${now.clone().add(62, 'days').format('YYYY-MM-DD')}`;

    await createFile(`${note1}.md`);
    await createFile(`${note2}.md`);
    await createFile(`${note3}.md`);

    const dailyQuickPick = createDailyQuickPick();

    const item1 = dailyQuickPick.items.find((item) => item.detail === note1)!;
    const item2 = dailyQuickPick.items.find((item) => item.detail === note2)!;
    const item3 = dailyQuickPick.items.find((item) => item.detail === note3)!;

    expect(dailyQuickPick.items).toHaveLength(66);

    expect(item1).not.toBeFalsy();
    expect(item2).not.toBeFalsy();
    expect(item3).not.toBeFalsy();
  });
});
