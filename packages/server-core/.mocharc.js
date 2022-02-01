module.exports = {
  'fail-zero': true,
  parallel: true,
  spec: ['**/**/*.test.ts'],
  require: [
    'tests/mocha.env', // init env here
    'ts-node/register'
  ],
  extension: [
    'ts'
  ],
  exit: true,
  recursive: true,
  jobs: '1',
  timeout: '60000'
};