// Background service worker for ZetaPay extension
console.log("ZetaPay background service worker loaded.");

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
    // Store order details
    await chrome.storage.local.set({ 
      pendingOrder: {
        ...orderDetails,
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
    
    return { success: true };
  } catch (error) {
    console.error('Payment flow error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// PRICE ALERTS
// ============================================

let priceAlerts = [];

async function checkPriceAlerts() {
  const alerts = await new Promise((resolve) => {
    chrome.storage.local.get(['priceAlerts'], (result) => {
      resolve(result.priceAlerts || []);
    });
  });
  
  priceAlerts = alerts;
  
  // Check each alert (mock implementation)
  for (const alert of priceAlerts) {
    if (alert.enabled) {
      // In production, fetch actual prices from CoinGecko API
      console.log(`Checking price alert: ${alert.token} at ${alert.targetPrice}`);
    }
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
      await saveTransaction({
        txHash: message.txHash,
        amount: message.amount,
        currency: message.currency,
        status: 'success'
      });
      
      chrome.storage.local.remove('pendingOrder');
      
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
