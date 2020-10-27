//SPDX-License-Identifier: MIT
pragma solidity >=0.5.15;

contract Splitter {
    uint256 public contractBalance;
    mapping(address => uint256) accountBalances;

    constructor() public {}

    function splitFunds(address _receiver1, address _receiver2)
        public
        payable
    {}
}
