const { expect } = require('chai');
const { Migration } = require(process.cwd() + '/scripts/utils');

let Account;
let Wallet;
let Sample;
let sample;

const migration = new Migration();
const getRandomNonce = () => Math.random() * 64000 | 0;

describe('Test Sample contract', async function () {
  describe('Contracts', async function () {
    it('Load contract factory', async function () {
      Sample = await locklift.factory.getContract('Sample');
      Wallet = await locklift.factory.getAccount('Wallet');
      expect(Sample.code).not.to.equal(undefined, 'Code should be available');
      expect(Sample.abi).not.to.equal(undefined, 'ABI should be available');
    });

    it('Deploy contracts', async function () {
      this.timeout(20000);

      const [keyPair] = await locklift.keys.getKeyPairs();

      sample = await locklift.giver.deployContract({
        contract: Sample,
        constructorParams: {},
        initParams: {
          _nonce: getRandomNonce(),
        },
        keyPair,
      });

      Account = await locklift.giver.deployContract({
        contract: Wallet,
        constructorParams: {},
        initParams: {
          _randomNonce: getRandomNonce()
        },

      });

      expect(sample.address).to.be.a('string')
        .and.satisfy(s => s.startsWith('0:'), 'Bad future address for Sample');
      expect(Account.address).to.be.a('string')
        .and.satisfy(s => s.startsWith('0:'), 'Bad future address for Sample');

      migration.store(sample, 'sample');
      migration.store(Wallet, 'wallet');
      await migration.balancesCheckpoint();
    });

    it('Interact with contract', async function () {
      await Account.runTarget({
        contract: sample,
        method: 'touch',
        params: {},
        value: 100000000  // 0.1 ever
      });

      await migration.balancesCheckpoint();

      this.timeout(10000);

      await Account.runTarget({
        contract: sample,
        method: 'touch',
        params: {},
        value: 100000000  // 0.1 ever
      });

      await migration.balancesCheckpoint();
      console.log(migration.balance_history);
    });
  });
});
