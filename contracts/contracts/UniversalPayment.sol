// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@zetachain/protocol-contracts/contracts/zevm/interfaces/IZRC20.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/IGatewayZEVM.sol";
import "@zetachain/protocol-contracts/contracts/zevm/SystemContract.sol";
import "./SwapHelperLib.sol";

/**
 * @title UniversalPayment
 * @notice A ZetaChain Universal App for cross-chain payment processing
 * @dev Receives tokens from any chain, swaps them to the target token, and sends to recipient
 */
contract UniversalPayment {
    // The ZetaChain system contract (contains Uniswap router addresses)
    SystemContract public systemContract;
    
    // The ZetaChain Gateway for universal app calls
    IGatewayZEVM public gateway;
    
    // Events
    event PaymentProcessed(
        address indexed sender,
        address indexed recipient,
        address inputToken,
        address targetToken,
        uint256 inputAmount,
        uint256 outputAmount
    );
    
    event PaymentFailed(
        address indexed sender,
        string reason
    );

    constructor(address gatewayAddress, address systemContractAddress) {
        gateway = IGatewayZEVM(gatewayAddress);
        systemContract = SystemContract(systemContractAddress);
    }

    /**
     * @notice Process a payment by swapping tokens and transferring to recipient
     * @param inputToken The ZRC20 token being sent
     * @param amount The amount of input tokens
     * @param targetToken The ZRC20 token to swap to
     * @param recipient The final recipient address on ZetaChain
     */
    function processPayment(
        address inputToken,
        uint256 amount,
        address targetToken,
        address recipient
    ) external {
        require(amount > 0, "Amount must be greater than 0");
        require(recipient != address(0), "Invalid recipient address");
        
        // Transfer tokens from sender to this contract
        require(
            IZRC20(inputToken).transferFrom(msg.sender, address(this), amount),
            "Token transfer failed"
        );

        // If input and target tokens are the same, just transfer directly
        if (inputToken == targetToken) {
            require(
                IZRC20(targetToken).transfer(recipient, amount),
                "Transfer to recipient failed"
            );
            
            emit PaymentProcessed(
                msg.sender,
                recipient,
                inputToken,
                targetToken,
                amount,
                amount
            );
            return;
        }

        // Swap the input token for the target token using SwapHelperLib
        uint256 swappedAmount = SwapHelperLib.swapExactTokensForTokens(
            systemContract,
            inputToken,
            amount,
            targetToken,
            0 // minAmountOut (0 for testing, should be calculated in production)
        );

        // Transfer the swapped tokens to the final recipient
        require(
            IZRC20(targetToken).transfer(recipient, swappedAmount),
            "Transfer to recipient failed"
        );
        
        emit PaymentProcessed(
            msg.sender,
            recipient,
            inputToken,
            targetToken,
            amount,
            swappedAmount
        );
    }
    
    /**
     * @notice Withdraw any stuck tokens (emergency function)
     * @param token The token address to withdraw
     * @param to The address to send tokens to
     * @param amount The amount to withdraw
     */
    function emergencyWithdraw(
        address token,
        address to,
        uint256 amount
    ) external {
        require(IZRC20(token).transfer(to, amount), "Emergency withdraw failed");
    }
}
