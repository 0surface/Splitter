const Web3 = require("web3");
const truffleContract = require("truffle-contract");
const $ = require("jquery");
const splitterJson = require("../../build/contracts/Splitter.json");
require("file-loader?name=../index.html!../index.html");

let accounts = [];
let account = null;

if (typeof web3 !== "undefined") {
  // Use the Mist/wallet/Metamask provider.
  window.web3 = new Web3(web3.currentProvider);
} else {
  // Your preferred fallback.
  window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
}

const Splitter = truffleContract(splitterJson);
Splitter.setProvider(web3.currentProvider);

const showBalance = async function (index) {
  if (index > 5) {
    throw new Error("Invalid account index");
  }

  let accountAddress = this.accounts[index];
  let balaceInWei = await web3.eth.getBalance(accountAddress);
  let etherBalance = web3.utils.fromWei(balaceInWei, "ether");

  let addressElement = document.getElementById(`address${index}`);
  let balanceElement = document.getElementById(`address${index}Balance`);
  addressElement.innerHTML = accountAddress;
  balanceElement.innerHTML = etherBalance;
};

window.addEventListener("load", function () {
  web3.eth
    .getAccounts()
    .then((accounts) => {
      if (accounts.length == 0) {
        throw new Error("No account with which to transact");
      }
      this.accounts = accounts;
      window.account = accounts[0];

      console.log("Account:", window.account);
      console.log("Accounts:", this.accounts);
      return web3.eth.net.getId();
    })
    .then(() => {
      [0, 1, 2, 3, 4].map((i) => showBalance(i));
    })
    .catch(console.error);
});
