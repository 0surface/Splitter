const Splitter = artifacts.require("Splitter");
const truffleAssert = require("truffle-assertions");

contract("Splitter", (accounts) => {
  let splitter;
  let deployer = accounts[0];
  let fundSender = accounts[1];
  let receiver_1 = accounts[2];
  let receiver_2 = accounts[3];
  let randomAddress = accounts[4];

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

  it("should emit event on successful withdrawal", (done) => {
    let _sentAmount = 20;
    let _fundBeforeWithdrawal = 0;
    splitter.contract.methods
      .split(receiver_1, receiver_2)
      .send({
        from: fundSender,
        value: _sentAmount,
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
        done();
      })
      .catch(done);
  });

  it("withdrawer should get their allocated money", async () => {
    let _sentAmount = web3.utils.toWei("20", "ether");

    let weiBefore = await web3.eth.getBalance(receiver_1);

    await splitter.contract.methods.split(receiver_1, receiver_2).send({ from: fundSender, value: _sentAmount });

    let withdrawTxReceipt = await splitter.contract.methods.withdraw().send({ from: receiver_1 });

    let weiAfter = await web3.eth.getBalance(receiver_1);

    assert.isTrue(weiAfter > weiBefore, "withdrawer didn't get their money");
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
    let _sentAmount = 21;

    await splitter.contract.methods.split(receiver_1, receiver_2).send({
      from: fundSender,
      value: _sentAmount,
    });

    await truffleAssert.reverts(splitter.contract.methods.withdraw().send({ from: randomAddress }), "No funds to withdraw");
  });

  it("should reset receiver's assigned funds back to zero on withdrawal", (done) => {
    let _sentAmount = 20;

    splitter.contract.methods
      .split(receiver_1, receiver_2)
      .send({
        from: fundSender,
        value: _sentAmount,
      })
      .then(() => {
        splitter.contract.methods.withdraw().send({ from: receiver_1 });
        return splitter.accountBalances.call(receiver_1);
      })
      .then((receiver1Balance) => {
        assert.equal(receiver1Balance.toString(10), 0, "receiver balance record is NOT set to zero after withdrwal");
        done();
      })
      .catch(done);
  });
});
