// Popup script for ZetaPay extension
// Manages the main popup UI and payment flow

let currentState = 'notConnected';
let pendingPayment = null;
let priceTicker = null;
let contractInterface = null;

// Load contract configuration
if (typeof CONTRACT_CONFIG !== 'undefined') {
  contractInterface = CONTRACT_CONFIG;
}

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup loaded');
  
  // Initialize wallet manager
  await walletManager.init();
  
  // Initialize price ticker
  if (typeof PriceTicker !== 'undefined') {
    priceTicker = new PriceTicker();
  }
  
  // Check connection status
  if (walletManager.isConnected) {
    await onWalletConnected();
  } else {
    showState('notConnected');
  }
  
  // Check for pending payment
  await checkPendingPayment();
  
  // Setup event listeners
  setupEventListeners();
});

// ============================================
// STATE MANAGEMENT
// ============================================

function showState(stateName) {
  currentState = stateName;
  
  // Hide all states
  document.querySelectorAll('.state').forEach(state => {
    state.classList.remove('active');
  });
  
  // Show target state
  const stateMap = {
    'notConnected': 'notConnectedState',
    'connected': 'connectedState',
    'payment': 'paymentState',
    'loading': 'loadingState',
    'success': 'successState',
    'error': 'errorState'
  };
  
  const targetId = stateMap[stateName];
  if (targetId) {
    document.getElementById(targetId).classList.add('active');
  }
  
  // Update header
  if (walletManager.isConnected) {
    document.getElementById('walletInfo').style.display = 'block';
    const info = walletManager.getAccountInfo();
    document.getElementById('walletAddress').textContent = info.shortAddress;
    document.getElementById('networkBadge').textContent = walletManager.getChainName();
  } else {
    document.getElementById('walletInfo').style.display = 'none';
  }
}

// ============================================
// WALLET CONNECTION
// ============================================

async function onWalletConnected() {
  console.log('Wallet connected');
  
  // Check if there's a pending payment
  const hasPendingPayment = await checkPendingPayment();
  
  if (hasPendingPayment) {
    showState('payment');
  } else {
    showState('connected');
    
    // Initialize price ticker
    if (priceTicker) {
      priceTicker.init('priceTicker');
    }
  }
}

async function connectWallet() {
  try {
    showState('loading');
    document.getElementById('loadingText').textContent = 'Connecting wallet...';
    document.getElementById('loadingSubtext').textContent = 'Please approve in MetaMask';
    
    const result = await walletManager.connect();
    
    if (result.success) {
      await onWalletConnected();
    } else {
      throw new Error('Connection failed');
    }
  } catch (error) {
    console.error('Connect error:', error);
    showError(error.message || 'Failed to connect wallet');
  }
}

// ============================================
// PAYMENT FLOW
// ============================================

async function checkPendingPayment() {
  try {
    const data = await chrome.storage.local.get(['pendingPayment']);
    
    if (data.pendingPayment) {
      pendingPayment = data.pendingPayment;
      displayPendingPayment();
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Check pending payment error:', error);
    return false;
  }
}

function displayPendingPayment() {
  if (!pendingPayment) return;
  
  const orderDetails = pendingPayment.orderDetails || pendingPayment;
  
  document.getElementById('paymentAmount').textContent = orderDetails.amount || '0.00';
  document.getElementById('paymentCurrency').textContent = orderDetails.currency || 'USD';
  document.getElementById('merchantName').textContent = orderDetails.merchant || 'Unknown';
  
  // Calculate crypto equivalent (placeholder)
  // In production, fetch real-time conversion rate
  const cryptoAmount = (parseFloat(orderDetails.amount) / 2000).toFixed(4); // Assuming 1 ZETA = $2000
  document.getElementById('conversionRate').textContent = `≈ ${cryptoAmount} ZETA`;
  
  showState('payment');
}

async function confirmPayment() {
  try {
    if (!pendingPayment) {
      throw new Error('No pending payment');
    }
    
    showState('loading');
    document.getElementById('loadingText').textContent = 'Preparing transaction...';
    document.getElementById('loadingSubtext').textContent = 'Please wait';
    
    const orderDetails = pendingPayment.orderDetails || pendingPayment;
    
    // Get payment details from backend (if available)
    const paymentId = pendingPayment.payment?.id;
    
    // Calculate amount in wei (placeholder - should use real conversion)
    const amountInEth = parseFloat(orderDetails.amount) / 2000; // Mock conversion
    const amountInWei = BigInt(Math.floor(amountInEth * 1e18)).toString();
    
    // Get merchant address (in production, this comes from merchant registration)
    const recipientAddress = orderDetails.recipientAddress || '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
    
    document.getElementById('loadingText').textContent = 'Confirm in wallet...';
    document.getElementById('loadingSubtext').textContent = 'Please approve the transaction in MetaMask';
    
    let txHash;
    
    // Check if we should use the UniversalPayment contract
    if (contractInterface && window.ethereum) {
      try {
        // Ensure we're on ZetaChain network
        const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
        if (currentChainId !== contractInterface.network.chainId) {
          // Switch to ZetaChain
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: contractInterface.network.chainId }],
            });
          } catch (switchError) {
            // If network doesn't exist, add it
            if (switchError.code === 4902) {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: contractInterface.network.chainId,
                  chainName: contractInterface.network.chainName,
                  rpcUrls: contractInterface.network.rpcUrls || [contractInterface.network.rpcUrl],
                  blockExplorerUrls: [contractInterface.network.blockExplorer],
                  nativeCurrency: contractInterface.network.nativeCurrency || {
                    name: 'ZETA',
                    symbol: 'ZETA',
                    decimals: 18
                  }
                }],
              });
            } else {
              throw switchError;
            }
          }
        }
        
        // Create contract instance using ethers.js (if available)
        if (typeof ethers !== 'undefined') {
          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();
          const contract = new ethers.Contract(
            contractInterface.address,
            contractInterface.abi,
            signer
          );
          
          // Call initiatePayment on the contract
          const tokenAddress = ethers.constants.AddressZero; // Native token (ZETA)
          const data = ethers.utils.toUtf8Bytes(JSON.stringify({
            orderId: orderDetails.orderId || Date.now().toString(),
            merchant: orderDetails.merchant,
            amount: orderDetails.amount,
            currency: orderDetails.currency
          }));
          
          const tx = await contract.initiatePayment(
            recipientAddress,
            amountInWei,
            tokenAddress,
            data,
            { value: amountInWei }
          );
          
          txHash = tx.hash;
          
          document.getElementById('loadingText').textContent = 'Transaction sent...';
          document.getElementById('loadingSubtext').textContent = 'Waiting for confirmation';
          
          // Wait for confirmation
          await tx.wait();
        } else {
          // Fallback: direct transaction if ethers.js not available
          throw new Error('ethers.js not loaded');
        }
      } catch (contractError) {
        console.error('Contract interaction error:', contractError);
        // Fallback to simple transaction
        txHash = await walletManager.sendTransaction(
          recipientAddress,
          amountInWei,
          '0x'
        );
      }
    } else {
      // Fallback: simple transaction without contract
      txHash = await walletManager.sendTransaction(
        recipientAddress,
        amountInWei,
        '0x'
      );
    }
    
    document.getElementById('loadingText').textContent = 'Transaction confirmed!';
    document.getElementById('loadingSubtext').textContent = 'Payment successful';
    
    // Notify background script
    chrome.runtime.sendMessage({
      action: 'paymentCompleted',
      txHash,
      amount: orderDetails.amount,
      currency: orderDetails.currency,
      paymentId: paymentId
    });
    
    // Clear pending payment
    await chrome.storage.local.remove('pendingPayment');
    pendingPayment = null;
    
    // Show success
    document.getElementById('txHash').textContent = txHash;
    showState('success');
    
  } catch (error) {
    console.error('Payment error:', error);
    
    // Notify background about failure
    chrome.runtime.sendMessage({
      action: 'paymentFailed',
      error: error.message,
      amount: pendingPayment?.orderDetails?.amount,
      currency: pendingPayment?.orderDetails?.currency
    });
    
    showError(error.message || 'Payment failed');
  }
}

function cancelPayment() {
  chrome.storage.local.remove('pendingPayment');
  pendingPayment = null;
  showState('connected');
}

// ============================================
// NAVIGATION
// ============================================

function openHistory() {
  chrome.tabs.create({ url: chrome.runtime.getURL('history.html') });
}

function openSettings() {
  chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
}

function viewTransaction() {
  const txHash = document.getElementById('txHash').textContent;
  const explorerUrl = `https://athens.explorer.zetachain.com/tx/${txHash}`;
  chrome.tabs.create({ url: explorerUrl });
}

// ============================================
// ERROR HANDLING
// ============================================

function showError(message) {
  document.getElementById('errorMessage').textContent = message;
  showState('error');
}

function retryPayment() {
  if (pendingPayment) {
    showState('payment');
  } else {
    showState('connected');
  }
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
  // Connect button
  document.getElementById('connectBtn')?.addEventListener('click', connectWallet);
  
  // Menu button
  document.getElementById('menuBtn')?.addEventListener('click', () => {
    // Toggle menu (implement dropdown if needed)
    openSettings();
  });
  
  // View history from not connected state
  document.getElementById('viewHistoryBtn')?.addEventListener('click', openHistory);
  
  // Quick actions
  document.getElementById('historyAction')?.addEventListener('click', openHistory);
  document.getElementById('settingsAction')?.addEventListener('click', openSettings);
  document.getElementById('scanAction')?.addEventListener('click', () => {
    alert('QR Scanner coming soon!');
  });
  document.getElementById('alertsAction')?.addEventListener('click', openSettings);
  
  // Payment actions
  document.getElementById('confirmPaymentBtn')?.addEventListener('click', confirmPayment);
  document.getElementById('cancelPaymentBtn')?.addEventListener('click', cancelPayment);
  
  // Success actions
  document.getElementById('viewTxBtn')?.addEventListener('click', viewTransaction);
  document.getElementById('doneBtn')?.addEventListener('click', () => {
    showState('connected');
  });
  
  // Error actions
  document.getElementById('retryBtn')?.addEventListener('click', retryPayment);
  document.getElementById('closeErrorBtn')?.addEventListener('click', () => {
    showState('connected');
  });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatAmount(amount, decimals = 2) {
  return parseFloat(amount).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function shortenAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Listen for messages from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'paymentReady') {
    checkPendingPayment();
  }
  
  if (message.action === 'walletDisconnected') {
    showState('notConnected');
  }
});
