//SPDX-License-Identifier: MIT
pragma solidity >=0.5.15;

/*
@title Splitter
@dev split balance of sender into two & make funds available for withdrawal
*/
contract Splitter {
    uint256 public contractBalance;
    mapping(address => uint256) accountBalances;

    event LogSplitSuccessful(
        address sender,
        address receiver1,
        address receiver2,
        uint256 sentAmount
    );
    event LogFundWithdrawn(address withdrawer, uint256 withdrawn);

    constructor() public {}

    /*
     @dev split funds and record in storage
     */
    function splitFunds(address _receiver1, address _receiver2) public payable {
        uint256 _amount = msg.value;
        require(_amount >= 3, "Invalid minimum amount");
        require(
            (_receiver1 != address(0) && _receiver2 != address(0)),
            "Can't split money to null address"
        );

        uint256 splitAmount;
        bool paySenderOneWei;

        if (_amount % 2 == 0) {
            splitAmount = _amount / 2;
        } else {
            splitAmount = (_amount - 1) / 2;
            //Fund sender one wei
            uint256 sender_before = accountBalances[msg.sender];
            address sender = msg.sender;
            accountBalances[sender] = sender_before + 1;
        }

        contractBalance += _amount;

        uint256 balanceBefore_1 = accountBalances[_receiver1];
        accountBalances[_receiver1] = balanceBefore_1 + splitAmount;

        uint256 balanceBefore_2 = accountBalances[_receiver2];
        accountBalances[_receiver2] = balanceBefore_2 + splitAmount;

        if (paySenderOneWei) {
            uint256 sender_before = accountBalances[msg.sender];
            accountBalances[msg.sender] = sender_before + 1;
        }

        emit LogSplitSuccessful(msg.sender, _receiver1, _receiver2, _amount);
    }

    /*
    @dev Allow fund receiver to withdraw
    */
    function withdraw() public {
        uint256 withdrawerBalance = accountBalances[payable(msg.sender)];
        require(withdrawerBalance > 0, "No funds to withdraw");

        //clear account balance entry
        accountBalances[payable(msg.sender)] = 0;
        msg.sender.transfer(withdrawerBalance);
        contractBalance = contractBalance - withdrawerBalance;
        emit LogFundWithdrawn(msg.sender, withdrawerBalance);
    }
}
