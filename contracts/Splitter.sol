//SPDX-License-Identifier: MIT
pragma solidity 0.5.16;

import "./SafeMath.sol";

/*
@title Splitter
@dev split balance of sender into two & make funds available for withdrawal
*/
contract Splitter {
    mapping(address => uint256) accountBalances;

    event LogSplitSuccessful(
        address indexed sender,
        address indexed receiver1,
        address indexed receiver2,
        uint256 sentAmount
    );
    event LogFundWithdrawn(address indexed withdrawer, uint256 withdrawn);

    constructor() public {}

    /*
     @dev split funds and record in storage
     */
    function splitFunds(address _receiver1, address _receiver2) public payable {
        require(
            _receiver1 != address(0) && _receiver2 != address(0),
            "Can't split money to null address"
        );
        require(msg.value >= 2, "Invalid minimum amount");

        uint256 splitAmount;

        if (msg.value % 2 == 0) {
            splitAmount = SafeMath.div(msg.value, 2);
        } else {
            splitAmount = SafeMath.div(SafeMath.sub(msg.value, 1), 2);
            //Fund sender one wei
            accountBalances[msg.sender] = SafeMath.add(
                accountBalances[msg.sender],
                1
            );
        }

        accountBalances[_receiver1] = SafeMath.add(
            accountBalances[_receiver1],
            splitAmount
        );
        accountBalances[_receiver2] = SafeMath.add(
            accountBalances[_receiver2],
            splitAmount
        );

        emit LogSplitSuccessful(msg.sender, _receiver1, _receiver2, msg.value);
    }

    /*
    @dev Allow fund receiver to withdraw
    */
    function withdraw() public {
        uint256 withdrawerBalance = accountBalances[msg.sender];
        require(withdrawerBalance > 0, "No funds to withdraw");

        //clear account balance entry
        accountBalances[msg.sender] = 0;
        msg.sender.transfer(withdrawerBalance);

        emit LogFundWithdrawn(msg.sender, withdrawerBalance);
    }
}
