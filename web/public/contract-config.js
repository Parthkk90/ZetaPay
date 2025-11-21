// UniversalPayment Contract Configuration
// Deployed on ZetaChain Athens 3 Testnet

const CONTRACT_CONFIG = {
  // Contract address on ZetaChain Athens 3 Testnet
  address: '0xaC24d3E7b5cFDCf2DD1c3a1feB0AbCCd98301852',
  
  // Network configuration
  network: {
    chainId: '0x1b59', // 7001 in hex (ZetaChain Athens 3)
    chainName: 'ZetaChain Athens 3 Testnet',
    rpcUrl: 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public',
    blockExplorer: 'https://athens.explorer.zetachain.com'
  },
  
  // Contract ABI (only essential functions for the extension)
  abi: [
    // Read functions
    {
      "inputs": [],
      "name": "gateway",
      "outputs": [{"internalType": "address", "name": "", "type": "address"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "systemContract",
      "outputs": [{"internalType": "address", "name": "", "type": "address"}],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [{"internalType": "bytes32", "name": "", "type": "bytes32"}],
      "name": "payments",
      "outputs": [
        {"internalType": "address", "name": "sender", "type": "address"},
        {"internalType": "address", "name": "recipient", "type": "address"},
        {"internalType": "uint256", "name": "amount", "type": "uint256"},
        {"internalType": "enum PaymentStatus", "name": "status", "type": "uint8"},
        {"internalType": "uint256", "name": "timestamp", "type": "uint256"}
      ],
      "stateMutability": "view",
      "type": "function"
    },
    
    // Write functions
    {
      "inputs": [
        {"internalType": "address", "name": "recipient", "type": "address"},
        {"internalType": "uint256", "name": "amount", "type": "uint256"},
        {"internalType": "address", "name": "tokenAddress", "type": "address"},
        {"internalType": "bytes", "name": "data", "type": "bytes"}
      ],
      "name": "initiatePayment",
      "outputs": [{"internalType": "bytes32", "name": "paymentId", "type": "bytes32"}],
      "stateMutability": "payable",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "bytes32", "name": "paymentId", "type": "bytes32"}
      ],
      "name": "confirmPayment",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "bytes32", "name": "paymentId", "type": "bytes32"}
      ],
      "name": "cancelPayment",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    
    // Events
    {
      "anonymous": false,
      "inputs": [
        {"indexed": true, "internalType": "bytes32", "name": "paymentId", "type": "bytes32"},
        {"indexed": true, "internalType": "address", "name": "sender", "type": "address"},
        {"indexed": true, "internalType": "address", "name": "recipient", "type": "address"},
        {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"}
      ],
      "name": "PaymentInitiated",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {"indexed": true, "internalType": "bytes32", "name": "paymentId", "type": "bytes32"}
      ],
      "name": "PaymentConfirmed",
      "type": "event"
    },
    {
      "anonymous": false,
      "inputs": [
        {"indexed": true, "internalType": "bytes32", "name": "paymentId", "type": "bytes32"}
      ],
      "name": "PaymentCancelled",
      "type": "event"
    }
  ]
};

// Export for use in extension
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONTRACT_CONFIG;
}
