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

// const App = {
//   start: async function () {},

//   ashowBalance: async function (index) {},
// };

//window.App = App;

const showBalance = async function (index) {
  let addressElementTag = `address${index}`;
  let balanceElementTag = `address${index}Balance`;

  let addressElement = document.getElementById(addressElementTag);
  let balanceElement = document.getElementById(balanceElementTag);

  if (index > 9) {
    console.err("Invalid accounts address");
    addressElement.innerHTML("N/A");
    balanceElement.innerHTML("N/A");
    return;
  }

  let daddress = this.accounts[index];
  console.log("daddress: ", daddress);
  console.log(" address: ", daddress);

  let balaceInWei = await web3.eth.getBalance(daddress);
  let etherBalance = web3.utils.fromWei(balaceInWei, "ether");

  addressElement.innerHTML = daddress;
  balanceElement.innerHTML = etherBalance;
};

window.addEventListener("load", function () {
  //Splitter.deployed();
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
      showBalance(0);
      console.log("in addEventListener ");
    })
    .catch(console.error);
  //App.start();
});
