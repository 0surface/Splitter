const Splitter = artifacts.require("Splitter");
const truffleAssert = require("truffle-assertions");
const BigNumber = require("bignumber.js");

contract("Splitter", (accounts) => {
  before(async () => {
    it("TestRPC must have adequate number of addresses", () => {
      assert.isTrue(accounts.length >= 5, "Test has enough addresses");
    });
  });

  let splitter;
  const deployer = accounts[0];
  const fundSender = accounts[1];
  const receiver_1 = accounts[2];
  const receiver_2 = accounts[3];
  const nullAddress = "0x0000000000000000000000000000000000000000";

  beforeEach("deploy a fresh contract", async () => {
    splitter = await Splitter.new({ from: deployer });
  });

  it("contract should have no funds on deployment", async () => {
    const balance = await web3.eth.getBalance(splitter.address);
    assert.strictEqual(parseInt(balance), 0, "contract shouldn't have funds on deployment");
  });

  it("split method emits event", () => {
    const _sentAmount = 21;
    return splitter.contract.methods
      .split(receiver_1, receiver_2)
      .send({
        from: fundSender,
        value: _sentAmount,
      })
      .then((txObj) => {
        assert.isDefined(txObj.events.LogSplitSuccessful.returnValues, "LogSplitSuccessful event was not emmited");
        return txObj.events.LogSplitSuccessful.returnValues;
      })
      .then((eventValues) => {
        assert.strictEqual(eventValues.sender, fundSender, "sender is not same");
        assert.strictEqual(eventValues.receiver1, receiver_1, "receiver_1 is not same");
        assert.strictEqual(eventValues.receiver2, receiver_2, "receiver_2 is not same");
        assert.strictEqual(eventValues.sentAmount, _sentAmount.toString(), "Sent Amount is not equal to expected");
      });
  });

  it("contract address has the sent amount value", () => {
    const _sentAmount = 20;
    return splitter.contract.methods
      .split(receiver_1, receiver_2)
      .send({
        from: fundSender,
        value: _sentAmount,
      })
      .then((txObj) => {
        assert.isTrue(txObj.status, "Transaction didn't get mined");
        return web3.eth.getBalance(splitter.address);
      })
      .then((splitterBalance) => {
        assert.equal(splitterBalance, _sentAmount, "contract balance doesn't have sent value");
      });
  });

  it("splits even number sent value exactly into two", () => {
    const _sentAmount = 20;
    const _splitAmount = 10;

    return splitter.contract.methods
      .split(receiver_1, receiver_2)
      .send({
        from: fundSender,
        value: _sentAmount,
      })
      .then(() => {
        return splitter.accountBalances.call(receiver_1);
      })
      .then((receiver1Balance) => {
        assert.equal(receiver1Balance.toString(10), _splitAmount, "receiver 1 fund not equal to expected");
        return splitter.accountBalances.call(receiver_2);
      })
      .then((receiver2Balance) => {
        assert.equal(receiver2Balance.toString(10), _splitAmount, "receiver 2 fund not equal to expected");
        return splitter.accountBalances.call(fundSender);
      })
      .then((fundSenderBalance) => {
        assert.equal(fundSenderBalance.toString(10), 0, "fund sender is incorrectly assigned a value");
      });
  });

  it("Assigns 1 wei back to sender when sent odd value", () => {
    const _sentAmount = 21;

    return splitter.contract.methods
      .split(receiver_1, receiver_2)
      .send({
        from: fundSender,
        value: _sentAmount,
      })
      .then(() => {
        return splitter.accountBalances.call(fundSender);
      })
      .then((fundSenderBalance) => {
        const assignedValue = fundSenderBalance.toString(10);
        assert.equal(assignedValue, 1, "fundSender not assigned 1 wei");
      });
  });

  it("Recipient get owed amount compounded on multiple splits", () => {
    const _sentAmount = 20;
    const _splitAmount = 10;
    const splitCount = 3;

    return splitter.contract.methods
      .split(receiver_1, receiver_2)
      .send({ from: fundSender, value: _sentAmount })
      .then(() => {
        return splitter.contract.methods.split(receiver_1, receiver_2).send({ from: fundSender, value: _sentAmount });
      })
      .then(() => {
        return splitter.contract.methods.split(receiver_1, receiver_2).send({ from: fundSender, value: _sentAmount });
      })
      .then(() => {
        return splitter.accountBalances.call(receiver_1);
      })
      .then((receiver1Balance) => {
        const expected = new BigNumber(splitCount * _splitAmount);
        const actual = new BigNumber(receiver1Balance);
        assert.isTrue(actual.isEqualTo(expected), "First receiver has expected owed balance");
        assert.strictEqual(actual.toString(10), expected.toString(10), "First receiver did not get owed split values");
      });
  });

  it("reverts when a receiver null address", async () => {
    await truffleAssert.reverts(
      splitter.contract.methods.split(nullAddress, receiver_2).send({
        from: fundSender,
        value: 1,
      }),
      "Can't split money to null address"
    );
  });

  it("reverts when sent wei is less than 2", async () => {
    await truffleAssert.reverts(
      splitter.contract.methods.split(receiver_1, receiver_2).send({
        from: fundSender,
        value: 1,
      }),
      "Invalid minimum amount"
    );
  });
});
