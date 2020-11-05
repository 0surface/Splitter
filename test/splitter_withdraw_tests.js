const Splitter = artifacts.require("Splitter");
const BigNumber = require("bignumber.js");
const truffleAssert = require("truffle-assertions");

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

    splitter = await artifacts.require("Splitter.sol").new();
  });

  beforeEach("deploy a fresh contract ", async () => {
    splitter = await Splitter.new({ from: deployer });
    assert.equal(await web3.eth.getBalance(splitter.address), 0, "contract has no funds on deployment");
  });

  it("should emit event on successful withdrawal", () => {
    let _fundBeforeWithdrawal = 0;

    return splitter.contract.methods
      .split(receiver_1, receiver_2)
      .send({
        from: fundSender,
        value: 20,
      })
      .then(() => {
        return splitter.accountBalances.call(receiver_1);
      })
      .then((receiver1Balance) => {
        _fundBeforeWithdrawal = receiver1Balance;
        return splitter.contract.methods.withdraw().send({ from: receiver_1 });
      })
      .then((txObj) => {
        assert.isTrue(typeof txObj.events.LogFundWithdrawn !== "undefined", "LogFundWithdrawn event was not emmited");
      });
  });

  it("withdrawer should get their allocated money", async () => {
    const _sentAmount = web3.utils.toWei("2", "ether");
    const _owedAmount = web3.utils.toWei("1", "ether");

    const weiBeforeWithdraw = await web3.eth.getBalance(receiver_2);

    await splitter.contract.methods.split(receiver_1, receiver_2).send({ from: fundSender, value: _sentAmount });

    const _gasPrice = await web3.eth.getGasPrice();

    const withdrawTxObj = await splitter.contract.methods.withdraw().send({ from: receiver_2 });

    const _gasAmount = withdrawTxObj.gasUsed;

    const weiAfterWithdraw = await web3.eth.getBalance(receiver_2);

    const bn_gasPrice = new BigNumber(_gasPrice);
    const bn_gasAmount = new BigNumber(_gasAmount);
    const gasCost = bn_gasPrice.times(bn_gasAmount);

    const owed = new BigNumber(_owedAmount);
    const beforeBalance = new BigNumber(weiBeforeWithdraw);
    const afterBalance = new BigNumber(weiAfterWithdraw);

    const expectedAfterBalance = beforeBalance.plus(owed).minus(gasCost);

    //Use BigNumber methods
    assert.isTrue(afterBalance.isEqualTo(expectedAfterBalance), "withdrawer didn't get their exact owed amount");

    //Direct comparision
    assert.strictEqual(expectedAfterBalance.toString(10), afterBalance.toString(10), "withdrawer didn't get exact owed amount");
  });

  it("should withdraw exact amount assigned in storage", async () => {
    //split
    await splitter.contract.methods.split(receiver_1, receiver_2).send({
      from: fundSender,
      value: 20,
    });

    //fetch before withdrawal
    let _fundBeforeWithdrawal = await splitter.accountBalances.call(receiver_1);

    //withdraw
    let txObj = await splitter.contract.methods.withdraw().send({ from: receiver_1 });

    //fetch logged withdrawn
    let { withdrawn } = txObj.events.LogFundWithdrawn.returnValues;

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
});
