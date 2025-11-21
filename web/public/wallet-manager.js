// Wallet Connection Manager for ZetaPay Extension
// Handles Web3 wallet connections (MetaMask, WalletConnect, etc.)

class WalletManager {
  constructor() {
    this.provider = null;
    this.account = null;
    this.chainId = null;
    this.isConnected = false;
  }

  // Initialize wallet manager
  async init() {
    console.log('Wallet Manager initialized');
    
    // Check if MetaMask is installed
    if (typeof window.ethereum !== 'undefined') {
      this.provider = window.ethereum;
      
      // Check if already connected
      const accounts = await this.provider.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        this.account = accounts[0];
        this.isConnected = true;
        await this.getChainId();
        
        // Authenticate with backend
        await this.authenticateWithBackend();
      }
      
      // Setup listeners
      this.setupListeners();
    } else {
      console.warn('MetaMask not detected');
    }
  }

  // Setup event listeners
  setupListeners() {
    if (!this.provider) return;

    // Account changed
    this.provider.on('accountsChanged', async (accounts) => {
      console.log('Account changed:', accounts);
      if (accounts.length === 0) {
        this.disconnect();
      } else {
        this.account = accounts[0];
        await this.authenticateWithBackend();
      }
    });

    // Chain changed
    this.provider.on('chainChanged', (chainId) => {
      console.log('Chain changed:', chainId);
      this.chainId = chainId;
      window.location.reload(); // Reload on chain change
    });

    // Disconnect
    this.provider.on('disconnect', () => {
      console.log('Wallet disconnected');
      this.disconnect();
    });
  }

  // Connect wallet
  async connect() {
    try {
      if (!this.provider) {
        throw new Error('MetaMask not installed. Please install MetaMask to continue.');
      }

      // Request account access
      const accounts = await this.provider.request({ 
        method: 'eth_requestAccounts' 
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      this.account = accounts[0];
      this.isConnected = true;
      await this.getChainId();

      console.log('Wallet connected:', this.account);

      // Authenticate with backend
      await this.authenticateWithBackend();

      return {
        success: true,
        account: this.account,
        chainId: this.chainId,
      };
    } catch (error) {
      console.error('Connect error:', error);
      throw error;
    }
  }

  // Disconnect wallet
  disconnect() {
    this.account = null;
    this.isConnected = false;
    this.chainId = null;
    
    // Logout from backend
    chrome.runtime.sendMessage({ action: 'logoutUser' });
    
    console.log('Wallet disconnected');
  }

  // Get current chain ID
  async getChainId() {
    if (!this.provider) return null;
    
    try {
      this.chainId = await this.provider.request({ method: 'eth_chainId' });
      return this.chainId;
    } catch (error) {
      console.error('Get chain ID error:', error);
      return null;
    }
  }

  // Switch to specific chain
  async switchChain(chainId) {
    if (!this.provider) {
      throw new Error('No wallet connected');
    }

    try {
      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
      
      this.chainId = chainId;
      return true;
    } catch (error) {
      // Chain not added to wallet
      if (error.code === 4902) {
        throw new Error('Please add this network to your wallet first');
      }
      throw error;
    }
  }

  // Authenticate with backend API
  async authenticateWithBackend() {
    if (!this.account) {
      throw new Error('No account connected');
    }

    try {
      // Send authentication request to background script
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({
          action: 'authenticateUser',
          walletAddress: this.account,
        }, resolve);
      });

      if (response.success) {
        console.log('Authenticated with backend:', response.data.user);
        return response.data;
      } else {
        throw new Error(response.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Backend authentication error:', error);
      throw error;
    }
  }

  // Sign message
  async signMessage(message) {
    if (!this.provider || !this.account) {
      throw new Error('Wallet not connected');
    }

    try {
      const signature = await this.provider.request({
        method: 'personal_sign',
        params: [message, this.account],
      });

      return signature;
    } catch (error) {
      console.error('Sign message error:', error);
      throw error;
    }
  }

  // Send transaction
  async sendTransaction(to, value, data = '0x') {
    if (!this.provider || !this.account) {
      throw new Error('Wallet not connected');
    }

    try {
      const txParams = {
        from: this.account,
        to,
        value,
        data,
      };

      const txHash = await this.provider.request({
        method: 'eth_sendTransaction',
        params: [txParams],
      });

      console.log('Transaction sent:', txHash);
      return txHash;
    } catch (error) {
      console.error('Send transaction error:', error);
      throw error;
    }
  }

  // Get account balance
  async getBalance() {
    if (!this.provider || !this.account) {
      throw new Error('Wallet not connected');
    }

    try {
      const balance = await this.provider.request({
        method: 'eth_getBalance',
        params: [this.account, 'latest'],
      });

      // Convert from hex to decimal (wei)
      const balanceInWei = parseInt(balance, 16);
      // Convert to ETH
      const balanceInEth = balanceInWei / 1e18;

      return {
        wei: balanceInWei.toString(),
        eth: balanceInEth.toFixed(6),
      };
    } catch (error) {
      console.error('Get balance error:', error);
      return null;
    }
  }

  // Get account info
  getAccountInfo() {
    return {
      account: this.account,
      chainId: this.chainId,
      isConnected: this.isConnected,
      shortAddress: this.account ? `${this.account.slice(0, 6)}...${this.account.slice(-4)}` : null,
    };
  }

  // Format chain ID
  getChainName() {
    const chains = {
      '0x1': 'Ethereum Mainnet',
      '0x89': 'Polygon',
      '0x38': 'BSC',
      '0x1b59': 'ZetaChain Athens-3 Testnet',
      '0x1b58': 'ZetaChain Mainnet',
    };

    return chains[this.chainId] || `Chain ${this.chainId}`;
  }
}

// Create singleton instance
const walletManager = new WalletManager();

// Export for use in extension
if (typeof module !== 'undefined' && module.exports) {
  module.exports = walletManager;
}
