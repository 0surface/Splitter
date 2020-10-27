//SPDX-License-Identifier: MIT
pragma solidity >=0.7.0;

contract Splitter {
    uint public contractBalance;
    mapping(address => uint) accountBalances;

    constructor () payable {}

    function splitFunds(address _receiver1, address _receiver2) payable public {
        
    }
}