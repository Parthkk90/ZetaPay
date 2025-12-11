// Enhanced content script with auto-detection, QR scanner, and payment integration
console.log("ZetaPay Enhanced Extension v2.0 loaded");

// ============================================
// 1. PAYMENT BUTTON DETECTION
// ============================================

const MERCHANT_PATTERNS = {
  amazon: {
    domains: ['amazon.com', 'amazon.in', 'amazon.co.uk'],
    checkoutUrls: ['/gp/buy/spc/', '/checkout/', '/cart'],
    totalSelector: '#subtotals-marketplace-table .grand-total-price',
    buttonSelectors: ['input[name="placeYourOrder"]', '.place-order-button']
  },
  shopify: {
    domains: ['myshopify.com'],
    checkoutUrls: ['/checkout', '/cart'],
    totalSelector: '.total-line__price',
    buttonSelectors: ['button[type="submit"]', '.order-summary__submit']
  },
  stripe: {
    domains: ['checkout.stripe.com'],
    checkoutUrls: ['/pay/', '/c/pay'],
    totalSelector: '.ProductSummaryTotal',
    buttonSelectors: ['button[type="submit"]']
  },
  ebay: {
    domains: ['ebay.com', 'ebay.in'],
    checkoutUrls: ['/checkout/', '/purchaseconfirm'],
    totalSelector: '.grand-total .amount',
    buttonSelectors: ['button#reviewBtn', 'button.confirm-btn']
  },
  woocommerce: {
    checkoutUrls: ['/checkout', '/cart'],
    totalSelector: '.order-total .amount',
    buttonSelectors: ['#place_order', '.wc-proceed-to-checkout']
  }
};

// Detect current merchant
function detectMerchant() {
  const hostname = window.location.hostname;
  const pathname = window.location.pathname;

  for (const [merchant, config] of Object.entries(MERCHANT_PATTERNS)) {
    if (config.domains && config.domains.some(domain => hostname.includes(domain))) {
      return { merchant, config };
    }
    if (config.checkoutUrls && config.checkoutUrls.some(url => pathname.includes(url))) {
      return { merchant, config };
    }
  }
  return null;
}

// Extract order details intelligently
function extractOrderDetails() {
  const detection = detectMerchant();
  
  if (!detection) {
    return {
      amount: "0.00",
      currency: "USD",
      merchantId: "unknown",
      orderId: `order-${Date.now()}`,
      items: []
    };
  }

  const { merchant, config } = detection;
  
  // Try to extract total amount
  let amount = "0.00";
  if (config.totalSelector) {
    const totalElement = document.querySelector(config.totalSelector);
    if (totalElement) {
      amount = totalElement.textContent.replace(/[^0-9.]/g, '');
    }
  }

  // Detect currency from page
  let currency = "USD";
  const currencyMatch = document.body.textContent.match(/\b(USD|EUR|GBP|INR|AUD|CAD)\b/);
  if (currencyMatch) {
    currency = currencyMatch[1];
  }

  return {
    amount,
    currency,
    merchantId: merchant,
    merchantUrl: window.location.hostname,
    orderId: `order-${Date.now()}`,
    pageUrl: window.location.href,
    timestamp: new Date().toISOString()
  };
}

// ============================================
// 2. INJECT ZETAPAY PAYMENT BUTTON
// ============================================

let zetaPayButton = null;

function injectPaymentButton() {
  // Check if already injected
  if (document.getElementById("zetapay-button")) return;

  const detection = detectMerchant();
  if (!detection) {
    console.log("Not a recognized checkout page, button not injected.");
    return;
  }

  const button = document.createElement("button");
  button.id = "zetapay-button";
  button.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="white" style="margin-right: 8px; vertical-align: middle;">
      <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
      <path d="M2 17L12 22L22 17M2 12L12 17L22 12"/>
    </svg>
    Pay with Crypto
  `;
  
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 15px 30px;
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
    z-index: 999999;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  `;

  button.addEventListener("mouseenter", () => {
    button.style.transform = "translateY(-2px) scale(1.05)";
    button.style.boxShadow = "0 12px 35px rgba(102, 126, 234, 0.5)";
  });

  button.addEventListener("mouseleave", () => {
    button.style.transform = "translateY(0) scale(1)";
    button.style.boxShadow = "0 8px 25px rgba(102, 126, 234, 0.4)";
  });

  button.addEventListener("click", async () => {
    button.disabled = true;
    button.innerHTML = `
      <div style="display: inline-block; width: 16px; height: 16px; border: 2px solid white; border-top-color: transparent; border-radius: 50%; animation: spin 0.6s linear infinite; margin-right: 8px;"></div>
      Processing...
    `;
    
    const orderDetails = extractOrderDetails();
    
    // Send message to extension popup
    chrome.runtime.sendMessage({
      action: "openPaymentFlow",
      orderDetails,
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error:", chrome.runtime.lastError);
        button.disabled = false;
        button.innerHTML = `
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white" style="margin-right: 8px; vertical-align: middle;">
            <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
            <path d="M2 17L12 22L22 17M2 12L12 17L22 12"/>
          </svg>
          Pay with Crypto
        `;
      }
    });
  });

  // Add CSS animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(button);
  zetaPayButton = button;
  console.log(`ZetaPay button injected on ${detection.merchant} checkout page.`);
}

// ============================================
// 3. MESSAGE LISTENERS
// ============================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "paymentSuccess") {
    // Show success notification
    if (zetaPayButton) {
      zetaPayButton.innerHTML = '✓ Payment Complete';
      zetaPayButton.style.background = '#10b981';
      setTimeout(() => zetaPayButton?.remove(), 3000);
    }
  }
  
  if (request.action === "paymentFailed") {
    if (zetaPayButton) {
      zetaPayButton.disabled = false;
      zetaPayButton.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white" style="margin-right: 8px; vertical-align: middle;">
          <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
          <path d="M2 17L12 22L22 17M2 12L12 17L22 12"/>
        </svg>
        Pay with Crypto
      `;
    }
  }
  
  if (request.action === "getPageInfo") {
    sendResponse({
      url: window.location.href,
      merchant: detectMerchant()?.merchant || 'unknown',
      orderDetails: extractOrderDetails()
    });
  }
  
  return true;
});

// ============================================
// 4. INITIALIZATION
// ============================================

function initialize() {
  // Wait for DOM to be fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      injectPaymentButton();
    });
  } else {
    injectPaymentButton();
  }
  
  // Re-check periodically for dynamic content
  setInterval(() => {
    if (!document.getElementById("zetapay-button")) {
      injectPaymentButton();
    }
  }, 2000);
}

initialize();
