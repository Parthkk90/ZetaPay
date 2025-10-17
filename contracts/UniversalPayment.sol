// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import {
    IZRC20
} from "@zetachain/protocol-contracts/contracts/zevm/interfaces/IZRC20.sol";
import {
    SYSTEM_CONTRACT
} from "@zetachain/protocol-contracts/contracts/zevm/SystemContract.sol";
import {
    SwapHelperLib
} from "@zetachain/toolkit/contracts/SwapHelperLib.sol";
import {
    UniversalApp
} from "@zetachain/toolkit/contracts/UniversalApp.sol";

contract UniversalPayment is UniversalApp {
    // @dev The Uniswap V2 router address on ZetaChain.
    address public constant UNISWAP_ROUTER_ADDRESS = 0x2ca7d64A7EFE2D62A725E2B35Cf7230D6677FfEe;

    constructor(address connectorAddress) UniversalApp(connectorAddress) {}

    /**
     * @notice This function is called when a cross-chain transaction is received.
     * @param origin The address of the sender on the origin chain.
     * @param amount The amount of tokens received.
     * @param message A byte array containing the target ZRC-20 token address and the final recipient address.
     */
    function onCall(
        bytes calldata origin,
        uint256, // originChainId
        address, // destinationAddress
        uint256, // destinationChainId
        uint256 amount,
        bytes calldata message
    ) external override isValidMessageCall(origin) {
        (address targetToken, address recipient) = abi.decode(
            message,
            (address, address)
        );

        address inputToken = msg.sender;

        // Approve the router to spend the input token
        IZRC20(inputToken).approve(UNISWAP_ROUTER_ADDRESS, amount);

        // Swap the input token for the target token
        uint256 swappedAmount = SwapHelperLib.swapExactTokensForTokens(
            UNISWAP_ROUTER_ADDRESS,
            inputToken,
            amount,
            targetToken,
            0 // minAmountOut
        );

        // Transfer the swapped tokens to the final recipient
        bool success = IZRC20(targetToken).transfer(recipient, swappedAmount);
        require(success, "Transfer to recipient failed");
    }
}
