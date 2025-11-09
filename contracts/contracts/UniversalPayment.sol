// SPDX-License-Identifier: MIT
pragma solidity 0.8.26;

import "@zetachain/protocol-contracts/contracts/zevm/interfaces/IZRC20.sol";
import "@zetachain/protocol-contracts/contracts/zevm/interfaces/IGatewayZEVM.sol";
import "@zetachain/protocol-contracts/contracts/zevm/SystemContract.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./SwapHelperLib.sol";

/**
 * @title UniversalPayment
 * @notice A ZetaChain Universal App for cross-chain payment processing
 * @dev Receives tokens from any chain, swaps them to the target token, and sends to recipient
 * @custom:security-contact security@zetapay.io
 */
contract UniversalPayment is Ownable, ReentrancyGuard, Pausable {
    // The ZetaChain system contract (contains Uniswap router addresses)
    SystemContract public immutable systemContract;
    
    // The ZetaChain Gateway for universal app calls
    IGatewayZEVM public immutable gateway;
    
    // Maximum slippage tolerance (basis points, 10000 = 100%)
    uint256 public constant MAX_SLIPPAGE_BPS = 500; // 5%
    
    // Minimum slippage tolerance (basis points)
    uint256 public minSlippageBps = 50; // 0.5% default

    // Token whitelist mapping - whether a token is accepted by the contract
    mapping(address => bool) public acceptedTokens;
    
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
    
    event SlippageUpdated(uint256 oldSlippage, uint256 newSlippage);
    
    event EmergencyWithdrawal(address indexed token, address indexed to, uint256 amount);
    
    // Custom errors (gas efficient)
    error InvalidAmount();
    error InvalidRecipient();
    error InvalidSlippage();
    error TokenTransferFailed();
    error InsufficientOutput();

    constructor(
        address gatewayAddress, 
        address systemContractAddress
    ) Ownable(msg.sender) {
        require(gatewayAddress != address(0), "Invalid gateway address");
        require(systemContractAddress != address(0), "Invalid system contract address");
        
        gateway = IGatewayZEVM(gatewayAddress);
        systemContract = SystemContract(systemContractAddress);
    }

    /**
     * @notice Process a payment by swapping tokens and transferring to recipient
     * @param inputToken The ZRC20 token being sent
     * @param amount The amount of input tokens
     * @param targetToken The ZRC20 token to swap to
     * @param recipient The final recipient address on ZetaChain
     * @param minAmountOut Minimum amount of target tokens expected (slippage protection)
     */
    function processPayment(
        address inputToken,
        uint256 amount,
        address targetToken,
        address recipient,
        uint256 minAmountOut
    ) external nonReentrant whenNotPaused {
        if (amount == 0) revert InvalidAmount();
        if (recipient == address(0)) revert InvalidRecipient();
        // Require target token to be accepted by this contract
        if (!acceptedTokens[targetToken]) revert InvalidRecipient();
        
        // Transfer tokens from sender to this contract
        if (!IZRC20(inputToken).transferFrom(msg.sender, address(this), amount)) {
            revert TokenTransferFailed();
        }

        uint256 outputAmount;

        // If input and target tokens are the same, just transfer directly
        if (inputToken == targetToken) {
            outputAmount = amount;
            
            if (!IZRC20(targetToken).transfer(recipient, outputAmount)) {
                revert TokenTransferFailed();
            }
            
            emit PaymentProcessed(
                msg.sender,
                recipient,
                inputToken,
                targetToken,
                amount,
                outputAmount
            );
            return;
        }

        // Calculate minimum acceptable output with slippage tolerance
        uint256 calculatedMinOut = (amount * (10000 - minSlippageBps)) / 10000;
        uint256 effectiveMinOut = minAmountOut > calculatedMinOut ? minAmountOut : calculatedMinOut;

        // Swap the input token for the target token using SwapHelperLib
        outputAmount = SwapHelperLib.swapExactTokensForTokens(
            systemContract,
            inputToken,
            amount,
            targetToken,
            effectiveMinOut
        );
        
        // Verify output meets minimum requirements
        if (outputAmount < effectiveMinOut) revert InsufficientOutput();

        // Transfer the swapped tokens to the final recipient
        if (!IZRC20(targetToken).transfer(recipient, outputAmount)) {
            revert TokenTransferFailed();
        }
        
        emit PaymentProcessed(
            msg.sender,
            recipient,
            inputToken,
            targetToken,
            amount,
            outputAmount
        );
    }
    
    /**
     * @notice Update minimum slippage tolerance
     * @param newSlippageBps New slippage in basis points (1-500)
     */
    function setMinSlippage(uint256 newSlippageBps) external onlyOwner {
        if (newSlippageBps == 0 || newSlippageBps > MAX_SLIPPAGE_BPS) {
            revert InvalidSlippage();
        }
        
        uint256 oldSlippage = minSlippageBps;
        minSlippageBps = newSlippageBps;
        
        emit SlippageUpdated(oldSlippage, newSlippageBps);
    }

    /**
     * @notice Set acceptance for a single token
     * @param token Token address
     * @param accepted Whether to accept the token
     */
    function setAcceptedToken(address token, bool accepted) external onlyOwner {
        require(token != address(0), "Invalid token");
        acceptedTokens[token] = accepted;
    }

    /**
     * @notice Batch update accepted tokens
     * @param tokens Array of token addresses
     * @param accepted Whether to accept (true) or reject (false)
     */
    function setAcceptedTokens(address[] calldata tokens, bool accepted) external onlyOwner {
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokens[i] != address(0)) {
                acceptedTokens[tokens[i]] = accepted;
            }
        }
    }
    
    /**
     * @notice Pause the contract (emergency only)
     * @dev Can only be called by owner
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @notice Unpause the contract
     * @dev Can only be called by owner
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice Withdraw any stuck tokens (emergency function)
     * @param token The token address to withdraw
     * @param to The address to send tokens to
     * @param amount The amount to withdraw
     * @dev Only callable by owner when contract is paused
     */
    function emergencyWithdraw(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner whenPaused {
        if (to == address(0)) revert InvalidRecipient();
        if (amount == 0) revert InvalidAmount();
        
        if (!IZRC20(token).transfer(to, amount)) {
            revert TokenTransferFailed();
        }
        
        emit EmergencyWithdrawal(token, to, amount);
    }
    
    /**
     * @notice Get contract version
     * @return Version string
     */
    function version() external pure returns (string memory) {
        return "1.0.0";
    }
}
