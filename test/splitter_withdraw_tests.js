const Splitter = artifacts.require("Splitter");
const truffleAssert = require("truffle-assertions");
const chai = require("chai");
const { BN } = web3.utils.BN;

// Enable and inject BN dependency
chai.use(require("chai-bn")(BN));
const { assert, expect } = chai;

contract("Splitter", (accounts) => {
  let splitter;
  const deployer = accounts[0];
  const fundSender = accounts[1];
  const receiver_1 = accounts[2];
  const receiver_2 = accounts[3];
  const randomAddress = accounts[4];

  before(async () => {
    it("TestRPC must have adequate number of addresses", () => {
      assert.isTrue(accounts.length >= 5, "Test has enough addresses");
    });
  });

  beforeEach("deploy a fresh contract ", async () => {
    splitter = await Splitter.new({ from: deployer });
    assert.equal(await web3.eth.getBalance(splitter.address), 0, "contract has no funds on deployment");
  });

  it("should emit event on successful withdrawal", () => {
    const _amountSent = 20;
    const _amountToWithdraw = 10;
    return splitter.contract.methods
      .split(receiver_1, receiver_2)
      .send({
        from: fundSender,
        value: _amountSent,
      })
      .then((splitTxObj) => {
        assert.isDefined(splitTxObj.events.LogSplitSuccessful, "Split failed prior to withdraw");
        return splitter.contract.methods.withdraw().send({ from: receiver_1 });
      })
      .then((withdrawTxObj) => {
        assert.isDefined(withdrawTxObj.events.LogFundWithdrawn, "Withdraw function failed");
        return withdrawTxObj.events.LogFundWithdrawn.returnValues;
      })
      .then((eventValues) => {
        assert.strictEqual(eventValues.withdrawer, receiver_1, "withdrawer address is not equal to expectede");
        assert.strictEqual(eventValues.withdrawn, _amountToWithdraw.toString(), "Withdrawn amount is not equal to expected");
      });
  });

  it("withdrawer should get their allocated money", async () => {
    const _sentAmount = web3.utils.toWei("2", "ether");
    const _owedAmount = web3.utils.toWei("1", "ether");

    const weiBeforeWithdraw = await web3.eth.getBalance(receiver_2);

    await splitter.contract.methods.split(receiver_1, receiver_2).send({ from: fundSender, value: _sentAmount });

    const withdrawTxObj = await splitter.contract.methods.withdraw().send({ from: receiver_2 });
    const _gasAmount = withdrawTxObj.gasUsed;

    const withdrawTx = await web3.eth.getTransaction(withdrawTxObj.transactionHash);
    const _gasPrice = withdrawTx.gasPrice;

    const weiAfterWithdraw = await web3.eth.getBalance(receiver_2);

    const bn_gasPrice = new BN(_gasPrice);
    const bn_gasAmount = new BN(_gasAmount);
    const gasCost = bn_gasPrice.mul(bn_gasAmount);

    const owed = new BN(_owedAmount);
    const beforeBalance = new BN(weiBeforeWithdraw);
    const afterBalance = new BN(weiAfterWithdraw);

    const expectedAfterBalance = beforeBalance.add(owed).sub(gasCost);

    expect(afterBalance).to.be.a.bignumber.that.equals(expectedAfterBalance);
  });

  it("should withdraw exact amount assigned in storage", async () => {
    await splitter.contract.methods.split(receiver_1, receiver_2).send({
      from: fundSender,
      value: 20,
    });

    const _fundBeforeWithdrawal = await splitter.accountBalances.call(receiver_1);

    const txObj = await splitter.contract.methods.withdraw().send({ from: receiver_1 });

    const { withdrawn } = txObj.events.LogFundWithdrawn.returnValues;

    assert.strictEqual(_fundBeforeWithdrawal.toString(10), withdrawn, "withdrawn is not equal to amount before Withdrawal");
  });

  it("should revert when an unassigned address attempts to withdraw", async () => {
    await splitter.contract.methods.split(receiver_1, receiver_2).send({
      from: fundSender,
      value: 21,
    });

    await truffleAssert.reverts(splitter.contract.methods.withdraw().send({ from: randomAddress }), "No funds to withdraw");
  });

  it("should reset receiver's assigned funds back to zero on withdrawal", () => {
    return splitter.contract.methods
      .split(receiver_1, receiver_2)
      .send({
        from: fundSender,
        value: 20,
      })
      .then(() => {
        splitter.contract.methods.withdraw().send({ from: receiver_1 });
        return splitter.accountBalances.call(receiver_1);
      })
      .then((receiver1Balance) => {
        assert.equal(receiver1Balance.toString(10), 0, "receiver balance record is NOT set to zero after withdrwal");
      });
  });

  it("should revert withdraw method call while contract is paused", async () => {
    return splitter.contract.methods
      .pause()
      .send({ from: deployer })
      .then((txObj) => {
        assert.isDefined(txObj.events.LogContractPaused, "pause call did not get mined");
        return splitter.paused.call();
      })
      .then((paused) => {
        assert.isTrue(paused, "contract failed to pause");
      })
      .then(() => {
        truffleAssert.reverts(splitter.contract.methods.withdraw().send({ from: receiver_1 }), "Contract is paused");
      });
  });
});
