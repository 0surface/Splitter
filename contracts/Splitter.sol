//SPDX-License-Identifier: MIT
pragma solidity 0.5.16;

import "./SafeMath.sol";

/*
@title Splitter
@dev split balance of sender into two & make funds available for withdrawal
*/
contract Splitter {
    using SafeMath for uint;

    mapping(address => uint256) public accountBalances;

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
    function split(address _receiver1, address _receiver2) public payable {
        require(
            _receiver1 != address(0) && _receiver2 != address(0),
            "Can't split money to null address"
        );
        require(msg.value >= 2, "Invalid minimum amount");

        accountBalances[_receiver1] = accountBalances[_receiver1].add(msg.value.div(2));        
        accountBalances[_receiver2] = accountBalances[_receiver2].add(msg.value.div(2));

        if (msg.value % 2 == 1) {
            accountBalances[msg.sender] = accountBalances[msg.sender].add(1);
        }

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
