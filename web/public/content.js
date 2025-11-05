console.log("ZetaPay content script loaded.");

// Detect checkout pages (basic heuristics for Amazon/Flipkart-like sites)
function isCheckoutPage() {
  const url = window.location.href.toLowerCase();
  const checkoutKeywords = ["checkout", "cart", "payment", "order"];
  return checkoutKeywords.some(keyword => url.includes(keyword));
}

// Extract order details from page (placeholder implementation)
function extractOrderDetails() {
  // In production, use DOM selectors specific to each merchant
  // For now, return mock data
  return {
    amount: "100.00",
    currency: "INR",
    merchantId: "merchant-123",
    orderId: `order-${Date.now()}`,
  };
}

function injectPaymentButton() {
  // Check if already injected
  if (document.getElementById("zetapay-button")) return;

  const button = document.createElement("button");
  button.id = "zetapay-button";
  button.innerHTML = "🔗 Pay with Crypto via ZetaChain";
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 15px 25px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    z-index: 10000;
    transition: transform 0.2s;
  `;

  button.addEventListener("mouseenter", () => {
    button.style.transform = "scale(1.05)";
  });

  button.addEventListener("mouseleave", () => {
    button.style.transform = "scale(1)";
  });

  button.addEventListener("click", () => {
    const orderDetails = extractOrderDetails();
    // Send message to extension popup/background to open payment flow
    chrome.runtime.sendMessage({
      action: "openPaymentFlow",
      orderDetails,
    });
  });

  document.body.appendChild(button);
}

// Only inject on checkout pages
if (isCheckoutPage()) {
  injectPaymentButton();
  console.log("ZetaPay button injected on checkout page.");
} else {
  console.log("Not a checkout page, button not injected.");
}
