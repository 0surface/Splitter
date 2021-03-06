const Web3 = require("web3");
const truffleContract = require("truffle-contract");
const $ = require("jquery");

const splitterJson = require("../../build/contracts/Splitter.json");
require("file-loader?name=../index.html!../index.html");

let wallets = [];

if (typeof web3 !== "undefined") {
  // Use the Mist/wallet/Metamask provider.
  window.web3 = new Web3(web3.currentProvider);
} else {
  // Your preferred fallback.
  const localProvider = new Web3.providers.HttpProvider("http://localhost:8545");
  window.web3 = new Web3(localProvider);
}

const Splitter = truffleContract(splitterJson);
Splitter.setProvider(web3.currentProvider);

const split = async function () {
  validateSplit();

  const gas = 2000000;
  const sender = $("input[id='sender']");
  const _receiver1 = $("input[id='receiver1']");
  const _receiver2 = $("input[id='receiver2']");
  const amount = $("input[id='amount']");

  const deployed = await Splitter.deployed();
  const { split } = deployed;

  const tranParamsObj = {
    from: sender.val(),
    value: web3.utils.toWei(amount.val(), "ether"),
    gas: gas,
  };

  try {
    await split.call(_receiver1.val(), _receiver2.val(), tranParamsObj);
  } catch (err) {
    $("#status").html("The split transaction will fail. Please check your account balance/ split amount.");
    flashRedError("status", 3);
    flashRedError("splitHeader", 3);
    throw new Error("The split transaction will fail anyway, not sending");
  }

  const txObj = await split
    .sendTransaction(_receiver1.val(), _receiver2.val(), tranParamsObj)
    .on("transactionHash", (txHash) => $("#status").html("Transaction on the way " + txHash));

  sender.val("");
  _receiver1.val("");
  _receiver2.val("");
  amount.val("");
  updateUI(txObj);
};

const validateSplit = async function () {
  $("#senderHelp").html("");
  $("#receiver1Help").html("");
  $("#receiver2Help").html("");
  $("#amountHelp").html("");

  let hasValidationError = false;

  if (!$("#sender").val()) {
    $("#senderHelp").html("Sender address is required").css("color", "red");
    hasValidationError = true;
  }
  if (!$("#receiver1").val()) {
    $("#receiver1Help").html("First receiver address is required").css("color", "red");
    hasValidationError = true;
  }
  if (!_receiver2.val()) {
    $("#receiver2Help").html("Second receiver address is required").css("color", "red");
    hasValidationError = true;
  }

  if (!amount.val()) {
    $("#amountHelp").html("Second receiver address is required").css("color", "red");
    hasValidationError = true;
  }

  if (hasValidationError) {
    return;
  }
};

const withdraw = async function () {
  const gas = 2000000;
  const withdrawer = $("input[id='withdrawer']");
  $("#withdrawerHelp").html("");

  if (!withdrawer.val()) {
    $("#withdrawerHelp").html("Second receiver address is required").css("color", "red");
    return;
  }

  const balanceInWei = await web3.eth.getBalance(withdrawer.val());
  if (balanceInWei < gas) {
    window.alert("You don't have sufficient funds in your balance");
    return;
  }

  const _deployed = await Splitter.deployed();
  const { withdraw } = _deployed;
  const transParamObj = { from: withdrawer.val(), gas: gas };

  const okToSend = await withdraw.call(transParamObj).catch((err) => {
    $("#status").html("The Withdraw transaction will fail. Please check your account balance/ split amount.");
    flashRedError("status", 3);
    flashRedError("withdrawHeader", 3);
    return false;
  });

  if (okToSend) {
    const txReceipt = await withdraw
      .sendTransaction(transParamObj)
      .on("transactionHash", (txHash) => $("#status").html("Transaction on the way " + txHash));

    updateUI(txReceipt);
  }

  withdrawer.val("");
};

const showBalance = async function (wallet) {
  if (wallet.i > 5) {
    throw new Error("Invalid account index");
  }

  document.getElementById(`address${wallet.i}`).innerHTML = wallet.address;

  return web3.eth
    .getBalance(wallet.address)
    .then((balanceInWei) => {
      document.getElementById(`address${wallet.i}Balance`).innerHTML = web3.utils.fromWei(balanceInWei, "ether");
    })
    .catch(console.error);
};

const showDappBalance = async function (wallet) {
  const _deployed = await Splitter.deployed();
  const { accountBalances } = _deployed;

  const dappBalanceElement = document.getElementById(`address${wallet.i}DappBalance`);

  return accountBalances
    .call(wallet.address)
    .then((dappBalance) => {
      dappBalanceElement.innerHTML = web3.utils.fromWei(dappBalance, "ether");
    })
    .catch(console.error);
};

const showContractBalance = async function () {
  Splitter.deployed()
    .then((contract) => {
      return web3.eth.getBalance(contract.address);
    })
    .then((balance) => {
      $("#contractBalance").html(web3.utils.fromWei(balance, "ether").toString(10));
    })
    .catch(console.error);
};

const updateUI = function (txObj) {
  if (!txObj.receipt.status) {
    console.error("Wrong status");
    console.error(txObj.receipt);
    $("#status").html("There was an error in the tx execution, status not 1");
  } else if (txObj.receipt.logs.length == 0) {
    console.error("Empty logs");
    console.error(txObj.receipt);
    $("#status").html("There was an error in the tx execution, missing expected event");
  } else {
    $("#status").html("Transfer executed");
  }
  showContractBalance();
  wallets.slice(0, 5).map((w) => {
    showBalance(w);
    showDappBalance(w);
  });
};

const flashRedError = function (elementIdTag, seconds) {
  const $el = $(`#${elementIdTag}`);
  const originalColor = $el.css("background");

  $el.css("background", "#FF5733");
  setTimeout(function () {
    $el.css("background", originalColor);
  }, seconds * 1000);
};

window.addEventListener("load", function () {
  web3.eth
    .getAccounts()
    .then((accounts) => {
      if (accounts.length == 0) {
        throw new Error("No accounts with which to transact");
      }
      window.account = accounts[0];
      return accounts;
    })
    .then((accountList) => {
      for (i = 0; i < 10; i++) {
        let address = accountList[i];
        wallets.push({ i, address });
      }
      wallets.slice(0, 5).map((w) => {
        showBalance(w);
        showDappBalance(w);
      });
    })
    .catch(console.error);

  showContractBalance();
});

$("#btnSplit").on("click", function () {
  split();
});

$("#btnWithdraw").on("click", function () {
  withdraw();
});
