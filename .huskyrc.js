const disableLinters = Number(process.env.DISABLE_MEMO_HOOKS) === 1;

module.exports = {
  hooks: {
    'pre-commit': disableLinters ? undefined : 'lint-staged',
  },
};
