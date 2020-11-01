const Web3 = require("web3");
const truffleContract = require("truffle-contract");
const $ = require("jquery");

const splitterJson = require("../../build/contracts/Splitter.json");
require("file-loader?name=../index.html!../index.html");

let accounts = [];
let wallets = [];

if (typeof web3 !== "undefined") {
  // Use the Mist/wallet/Metamask provider.
  window.web3 = new Web3(web3.currentProvider);
} else {
  // Your preferred fallback.
  let localProvider = new Web3.providers.HttpProvider("http://localhost:8545");
  window.web3 = new Web3(localProvider);
}

const Splitter = truffleContract(splitterJson);
Splitter.setProvider(web3.currentProvider);

const split = async function () {
  const gas = 2000000;
  let deployed;

  let sender = $("#sender").val();
  let _receiver1 = $("#receiver1").val();
  let _receiver2 = $("#receiver2").val();
  let amount = $("#amount").val();

  sender = accounts[1].toString();
  _receiver1 = accounts[2].toString();
  _receiver2 = accounts[3].toString();

  //If sender is empty, make current address sender
  sender = sender ? sender : window.account;

  if (!_receiver1 || !_receiver2 || !amount) {
    window.alert("Can't split, fill the rquired fields");
    return;
  }

  deployed = await Splitter.deployed();
  const { split } = deployed;

  let tranParamsObj = {
    from: sender,
    value: web3.utils.toWei(amount, "ether"),
    gas: gas,
  };

  return split
    .call(_receiver1, _receiver2, tranParamsObj)
    .then((simuilation) => {
      if (!simuilation) {
        $("#status").innerHTML = "The split transaction will fail. Please check your account balance/ split amount.";
        throw new Error("The transaction will fail anyway, not sending");
      }
      return split
        .sendTransaction(_receiver1, _receiver2, tranParamsObj)
        .on("transactionHash", (txHash) => $("#status").html("Transaction on the way " + txHash));
    })
    .then((txObj) => {
      $("#sender").val("");
      $("#receiver1").val("");
      $("#receiver1").val("");
      $("#amount").val("");
      postTransaction(txObj);
    })
    .catch(console.error);
};

const withdraw = async function () {
  const gas = 2000000;
  let withdrawer = $("#withdrawer").val();

  if (!withdrawer) {
    window.alert("You need to give a withdrawer address");
    return;
  }

  let balaceInWei = await web3.eth.getBalance(withdrawer);
  if (balaceInWei < gas) {
    window.alert("You don't have sufficient funds in your balance");
    return;
  }

  deployed = await Splitter.deployed();
  const { withdraw } = deployed;

  let transParamObj = { from: withdrawer, gas: gas };

  return withdraw
    .call(transParamObj)
    .then((simulation) => {
      if (!simulation) {
        $("#status").innerHTML = "The Withdraw transaction will fail. Please check your account balance/ split amount.";
        throw new Error("The transaction will fail anyway, not sending");
      }
      return withdraw
        .sendTransaction({ from: withdrawer, gas: gas })
        .on("transactionHash", (txHash) => $("#status").html("Transaction on the way " + txHash));
    })
    .then((txObj) => {
      $("#withdrawn").val("");
      postTransaction(txObj);
    })
    .catch(console.error);
};

const showBalance = async function (wallet) {
  if (wallet.i > 5) {
    throw new Error("Invalid account index");
  }

  document.getElementById(`address${wallet.i}`).innerHTML = wallet.address;

  return web3.eth
    .getBalance(wallet.address)
    .then((balaceInWei) => {
      document.getElementById(`address${wallet.i}Balance`).innerHTML = web3.utils.fromWei(balaceInWei, "ether");
    })
    .catch(console.error);
};

const postTransaction = function (txObj) {
  const receipt = txObj.receipt;
  console.log("got receipt", receipt);
  if (!receipt.status) {
    console.error("Wrong status");
    console.error(receipt);
    $("#status").html("There was an error in the tx execution, status not 1");
  } else if (receipt.logs.length == 0) {
    console.error("Empty logs");
    console.error(receipt);
    $("#status").html("There was an error in the tx execution, missing expected event");
  } else {
    console.log(receipt.logs[0]);
    $("#status").html("Transfer executed");
  }
  showContractBalance();
  wallets.slice(0, 5).map((w) => showBalance(w));
  wallets.slice(0, 5).map((w) => showDappBalance(w));
};

const showDappBalance = async function (wallet) {
  deployed = await Splitter.deployed();
  let { accountBalances } = deployed;
  let dappBalanceElement = document.getElementById(`address${wallet.i}DappBalance`);
  return accountBalances
    .call(wallet.address)
    .then((dappBalance) => {
      let etherBalance = web3.utils.fromWei(dappBalance, "ether");
      dappBalanceElement.innerHTML = etherBalance;
    })
    .catch(console.error);
};

const showContractBalance = async function () {
  let deployed;
  Splitter.deployed()
    .then((instance) => {
      deployed = instance;
      return deployed;
    })
    .then((contract) => {
      let cc = contract.address;
      return web3.eth.getBalance(cc);
    })
    .then((balance) => {
      console.log("balance : ", balance);
      $("#contractBalance").html(web3.utils.fromWei(balance, "ether").toString(10));
    })
    .catch(console.error);
};

window.addEventListener("load", function () {
  web3.eth
    .getAccounts()
    .then((accounts) => {
      if (accounts.length == 0) {
        throw new Error("No account with which to transact");
      }
      accounts = accounts;
      window.account = accounts[0];
      return web3.eth.net.getId();
    })
    .then(() => {
      for (i = 0; i < 10; i++) {
        let address = accounts[i];
        let balance = 0;
        let owed = 0;
        let wallet = { i, address, balance, owed };
        wallets.push(wallet);
      }
      wallets.slice(0, 5).map((w) => showBalance(w));
      wallets.slice(0, 5).map((w) => showDappBalance(w));
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
