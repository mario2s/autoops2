const Sequencer = require('@jest/test-sequencer').default;

const ORDER = ['auth', 'catalog', 'clients', 'vehicles', 'orders', 'users'];

function rank(testPath) {
  for (let i = 0; i < ORDER.length; i++) {
    if (testPath.includes(`${ORDER[i]}.test.ts`)) return i;
  }
  return ORDER.length;
}

class CustomSequencer extends Sequencer {
  sort(tests) {
    return [...tests].sort((a, b) => rank(a.path) - rank(b.path));
  }
}

module.exports = CustomSequencer;
