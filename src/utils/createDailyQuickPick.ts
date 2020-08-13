import moment from 'moment';
import range from 'lodash.range';
import { window } from 'vscode';

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

const createQuickPick = () => {
  const now = moment().startOf('day');

  const dayOffsets = [
    0, // Today
    1, // Tomorrow
    -1, // Yesterday
    ...range(2, 365 * 2), // Next month
    ...range(-2, -365 * 2), // Prev month
  ];
  const quickPick = window.createQuickPick();

  quickPick.matchOnDescription = true;
  quickPick.matchOnDetail = true;

  quickPick.items = dayOffsets.map((dayOffset) => {
    const date = now.clone().add(dayOffset, 'day');
    const dateYYYYMMDD = date.format('YYYY-MM-DD');

    return {
      label: `✕ ${toOffsetLabel(dayOffset)} | ${date.format('dddd, MMMM D, YYYY')}`,
      description: 'Missing',
      detail: dateYYYYMMDD,
    };
  });

  return quickPick;
};

export default createQuickPick;
