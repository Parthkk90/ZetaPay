// Background service worker for ZetaPay extension
console.log('ZetaPay background service worker loaded.');

// Import API client
importScripts('api-client.js');

// ============================================
// INITIALIZATION
// ============================================

let isInitialized = false;

async function initialize() {
  if (isInitialized) return;
  
  try {
    await api.init();
    console.log('API client initialized');
    
    // Update badge on startup
    updateBadge();
    
    isInitialized = true;
  } catch (error) {
    console.error('Initialization error:', error);
  }
}

// Initialize when service worker starts
initialize();

// ============================================
// NOTIFICATION MANAGER
// ============================================

function showBrowserNotification(title, message, type = 'info') {
  const iconUrl = type === 'success' 
    ? 'images/icon128.png' 
    : 'images/icon128.png';
  
  chrome.notifications.create({
    type: 'basic',
    iconUrl,
    title,
    message,
    priority: 2
  });
}

// ============================================
// STORAGE MANAGER
// ============================================

async function getStoredTransactions() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['transactions'], (result) => {
      resolve(result.transactions || []);
    });
  });
}

async function saveTransaction(transaction) {
  const transactions = await getStoredTransactions();
  transactions.unshift({
    ...transaction,
    timestamp: Date.now()
  });
  
  // Keep only last 100 transactions
  const trimmed = transactions.slice(0, 100);
  
  chrome.storage.local.set({ transactions: trimmed });
  updateBadge();
}

// ============================================
// BADGE COUNTER
// ============================================

async function updateBadge() {
  const transactions = await getStoredTransactions();
  const today = new Date().setHours(0, 0, 0, 0);
  
  const todayCount = transactions.filter(tx => 
    new Date(tx.timestamp).setHours(0, 0, 0, 0) === today
  ).length;
  
  if (todayCount > 0) {
    chrome.action.setBadgeText({ text: todayCount.toString() });
    chrome.action.setBadgeBackgroundColor({ color: '#667eea' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// ============================================
// PAYMENT FLOW HANDLER
// ============================================

async function handlePaymentFlow(orderDetails, tabId) {
  try {
    // Check if user is authenticated
    if (!api.isAuthenticated()) {
      // Request wallet connection
      showBrowserNotification(
        'Connect Wallet',
        'Please connect your wallet to make payments',
        'info'
      );
      
      // Open extension popup for authentication
      chrome.action.openPopup();
      
      return { success: false, error: 'Not authenticated' };
    }

    // Create payment in backend
    const payment = await api.createPayment({
      amount: orderDetails.amount,
      currency: orderDetails.currency,
      merchant: orderDetails.merchant,
      orderId: orderDetails.orderId || `EXT-${Date.now()}`,
      description: orderDetails.description || `Payment to ${orderDetails.merchant}`,
      platform: orderDetails.platform,
      returnUrl: orderDetails.url,
    });

    // Store payment details
    await chrome.storage.local.set({ 
      pendingPayment: {
        ...payment,
        orderDetails,
        tabId,
        timestamp: Date.now()
      }
    });
    
    // Open extension popup
    chrome.action.openPopup();
    
    // Show notification
    showBrowserNotification(
      'Payment Ready',
      `Amount: ${orderDetails.amount} ${orderDetails.currency}`,
      'info'
    );
    
    return { success: true, payment };
  } catch (error) {
    console.error('Payment flow error:', error);
    
    showBrowserNotification(
      'Payment Error',
      error.message || 'Failed to initialize payment',
      'error'
    );
    
    return { success: false, error: error.message };
  }
}

// ============================================
// PRICE ALERTS
// ============================================

let priceAlerts = [];
let lastPrices = {};

// Token ID mapping for CoinPaprika API
const TOKEN_IDS = {
  'BTC': 'btc-bitcoin',
  'ETH': 'eth-ethereum',
  'ZETA': 'zeta-zetachain',
  'BNB': 'bnb-binance-coin',
  'MATIC': 'matic-polygon'
};

async function fetchTokenPrice(tokenSymbol) {
  try {
    const tokenId = TOKEN_IDS[tokenSymbol];
    if (!tokenId) {
      console.error(`Unknown token: ${tokenSymbol}`);
      return null;
    }

    const response = await fetch(`https://api.coinpaprika.com/v1/tickers/${tokenId}`);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    const price = data.quotes?.USD?.price;
    
    if (price) {
      lastPrices[tokenSymbol] = {
        price,
        timestamp: Date.now(),
        change24h: data.quotes.USD.percent_change_24h
      };
    }

    return price;
  } catch (error) {
    console.error(`Error fetching ${tokenSymbol} price:`, error);
    return null;
  }
}

async function checkPriceAlerts() {
  const alerts = await new Promise((resolve) => {
    chrome.storage.local.get(['priceAlerts'], (result) => {
      resolve(result.priceAlerts || []);
    });
  });
  
  priceAlerts = alerts;
  
  // Check each alert
  for (const alert of priceAlerts) {
    if (alert.enabled) {
      const currentPrice = await fetchTokenPrice(alert.token);
      
      if (currentPrice) {
        // Check if price has crossed target
        const previousPrice = lastPrices[alert.token]?.price;
        
        if (alert.condition === 'reaches' || !alert.condition) {
          // Alert when price reaches or crosses target
          if (currentPrice >= alert.targetPrice && (!previousPrice || previousPrice < alert.targetPrice)) {
            triggerPriceAlert(alert, currentPrice, 'reached');
          }
        } else if (alert.condition === 'above') {
          if (currentPrice > alert.targetPrice) {
            triggerPriceAlert(alert, currentPrice, 'above');
          }
        } else if (alert.condition === 'below') {
          if (currentPrice < alert.targetPrice) {
            triggerPriceAlert(alert, currentPrice, 'below');
          }
        }
      }
    }
  }
}

function triggerPriceAlert(alert, currentPrice, status) {
  const title = `${alert.token} Price Alert`;
  const message = `${alert.token} is now $${currentPrice.toFixed(2)} (Target: $${alert.targetPrice})`;
  
  showBrowserNotification(title, message, 'info');
  
  // Optionally disable one-time alerts
  if (!alert.recurring) {
    alert.enabled = false;
    chrome.storage.local.set({ priceAlerts });
  }
}

// ============================================
// MESSAGE HANDLERS
// ============================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handlers = {
    openPaymentFlow: async () => {
      const result = await handlePaymentFlow(message.orderDetails, sender.tab?.id);
      sendResponse(result);
    },
    
    paymentCompleted: async () => {
      // Save transaction locally
      await saveTransaction({
        txHash: message.txHash,
        amount: message.amount,
        currency: message.currency,
        status: 'success',
        paymentId: message.paymentId,
      });
      
      // Update payment status in backend
      if (message.paymentId) {
        try {
          await api.updatePaymentStatus(message.paymentId, 'completed', message.txHash);
        } catch (error) {
          console.error('Failed to update payment status:', error);
        }
      }
      
      chrome.storage.local.remove('pendingPayment');
      
      // Notify content script
      if (sender.tab?.id) {
        chrome.tabs.sendMessage(sender.tab.id, {
          action: 'paymentSuccess',
          txHash: message.txHash
        });
      }
      
      showBrowserNotification(
        'Payment Successful',
        `Transaction: ${message.txHash.slice(0, 10)}...`,
        'success'
      );
      
      sendResponse({ success: true });
    },
    
    paymentFailed: async () => {
      await saveTransaction({
        error: message.error,
        amount: message.amount,
        currency: message.currency,
        status: 'failed'
      });
      
      if (sender.tab?.id) {
        chrome.tabs.sendMessage(sender.tab.id, {
          action: 'paymentFailed',
          error: message.error
        });
      }
      
      showBrowserNotification(
        'Payment Failed',
        message.error || 'Transaction failed',
        'error'
      );
      
      sendResponse({ success: true });
    },
    
    getTransactionHistory: async () => {
      const transactions = await getStoredTransactions();
      sendResponse({ transactions });
    },
    
    clearHistory: async () => {
      await chrome.storage.local.set({ transactions: [] });
      updateBadge();
      sendResponse({ success: true });
    },
    
    savePriceAlert: async () => {
      const alerts = await new Promise((resolve) => {
        chrome.storage.local.get(['priceAlerts'], (result) => {
          resolve(result.priceAlerts || []);
        });
      });
      
      alerts.push(message.alert);
      await chrome.storage.local.set({ priceAlerts: alerts });
      sendResponse({ success: true });
    },
    
    authenticateUser: async () => {
      try {
        const result = await api.authenticate(message.walletAddress, message.signature, message.message);
        sendResponse({ success: true, data: result });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    },
    
    getUserProfile: async () => {
      try {
        const profile = await api.getUserProfile();
        sendResponse({ success: true, data: profile });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    },
    
    getPaymentHistory: async () => {
      try {
        const history = await api.getPaymentHistory({
          limit: message.limit || 50,
          offset: message.offset || 0,
          status: message.status,
        });
        sendResponse({ success: true, data: history });
      } catch (error) {
        sendResponse({ success: false, error: error.message });
      }
    },
    
    syncTransactions: async () => {
      try {
        // Get transactions from backend
        const history = await api.getPaymentHistory({ limit: 100 });
        
        // Merge with local transactions
        const localTxs = await getStoredTransactions();
        const allTxs = [...history.payments, ...localTxs];
        
        // Remove duplicates by txHash
        const uniqueTxs = allTxs.reduce((acc, tx) => {
          const existing = acc.find(t => t.txHash === tx.txHash || t.id === tx.id);
          if (!existing) acc.push(tx);
          return acc;
        }, []);
        
        // Save merged transactions
        await chrome.storage.local.set({ transactions: uniqueTxs.slice(0, 100) });
        
        sendResponse({ success: true, count: uniqueTxs.length });
      } catch (error) {
        console.error('Sync error:', error);
        sendResponse({ success: false, error: error.message });
      }
    }
  };
  
  const handler = handlers[message.action];
  if (handler) {
    handler();
    return true; // Keep message channel open
  }
});

// ============================================
// CONTEXT MENU
// ============================================

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'zetapay-payment',
    title: 'Pay with ZetaPay',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'zetapay-payment') {
    const selectedText = info.selectionText;
    const amount = parseFloat(selectedText.replace(/[^0-9.]/g, ''));
    
    if (!isNaN(amount) && amount > 0) {
      handlePaymentFlow({
        amount: amount.toString(),
        currency: 'USD',
        merchant: 'Custom Payment'
      }, tab.id);
    }
  }
});

// ============================================
// PERIODIC TASKS (ALARMS)
// ============================================

chrome.alarms.create('updateBadge', { periodInMinutes: 1 });
chrome.alarms.create('checkPriceAlerts', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'updateBadge') {
    updateBadge();
  } else if (alarm.name === 'checkPriceAlerts') {
    checkPriceAlerts();
  }
});

// Initialize badge on startup
updateBadge();
