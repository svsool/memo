import moment from 'moment';
import range from 'lodash.range';
import path from 'path';
import { window } from 'vscode';

import { findUriByRef, getWorkspaceCache } from './utils';

const toOffsetLabel = (dayOffset: number) => {
  if (dayOffset === -1) {
    return '-1 day Yesterday';
  } else if (dayOffset === 0) {
    return 'Today';
  } else if (dayOffset === 1) {
    return '+1 day Tomorrow';
  }

  return `${dayOffset > 0 ? '+' : ''}${dayOffset} days`;
};

const yyyymmddRegExp = /([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))/;

const createDailyQuickPick = () => {
  const now = moment().startOf('day');
  const allDailyDates = getWorkspaceCache()
    .markdownUris.map((uri) => path.parse(uri.fsPath).name)
    .filter((name) => yyyymmddRegExp.exec(name) && moment(name).isValid());
  const existingDayOffsets = allDailyDates.map((dateStr) =>
    moment(dateStr).startOf('day').diff(now, 'days'),
  );
  const pastDayOffsets = existingDayOffsets
    .filter((dayOffset) => dayOffset <= -32)
    .sort((a, b) => b - a);
  const futureDayOffsets = existingDayOffsets
    .filter((dayOffset) => dayOffset >= 32)
    .sort((a, b) => a - b);

  const dayOffsets = [
    0, // Today
    1, // Tomorrow
    -1, // Yesterday
    ...range(2, 32), // Next month
    ...futureDayOffsets,
    ...range(-2, -32), // Prev month
    ...pastDayOffsets,
  ];
  const quickPick = window.createQuickPick();

  quickPick.matchOnDescription = true;
  quickPick.matchOnDetail = true;

  quickPick.items = dayOffsets.map((dayOffset) => {
    const date = now.clone().add(dayOffset, 'day');
    const dateYYYYMMDD = date.format('YYYY-MM-DD');
    const ref = findUriByRef(getWorkspaceCache().markdownUris, dateYYYYMMDD);

    return {
      label: `${ref ? '✓' : '✕'} ${toOffsetLabel(dayOffset)} | ${date.format(
        'dddd, MMMM D, YYYY',
      )}`,
      description: ref ? 'Exists' : 'Missing',
      detail: dateYYYYMMDD,
    };
  });

  return quickPick;
};

export default createDailyQuickPick;
