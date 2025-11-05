// Background script for ZetaPay extension
console.log("ZetaPay background script loaded.");

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openPaymentFlow") {
    console.log("Opening payment flow with order details:", message.orderDetails);
    
    // Store order details in storage for popup to access
    chrome.storage.local.set({ 
      pendingOrder: message.orderDetails 
    }, () => {
      // Open extension popup
      chrome.action.openPopup();
      sendResponse({ success: true });
    });
    
    return true; // Keep message channel open for async response
  }
});

// Listen for transaction completion from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "paymentCompleted") {
    console.log("Payment completed:", message.txHash);
    
    // Clear pending order
    chrome.storage.local.remove("pendingOrder");
    
    // Optionally notify content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "paymentSuccess",
          txHash: message.txHash,
        });
      }
    });
    
    sendResponse({ success: true });
    return true;
  }
});
