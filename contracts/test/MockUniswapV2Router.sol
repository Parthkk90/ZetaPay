// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

contract MockUniswapV2Router {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external pure returns (uint256[] memory amounts) {
        // This is a mock, so we don't need to do anything here.
        // The test will manually provide the swapped tokens.
        uint256[] memory mockAmounts = new uint256[](2);
        mockAmounts[0] = amountIn;
        mockAmounts[1] = amountIn * 2; // Simulate a 2x swap rate
        return mockAmounts;
    }
}
