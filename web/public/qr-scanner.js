// QR Code Scanner for ZetaPay
// Detects QR codes on web pages and extracts payment information

class QRCodeScanner {
  constructor() {
    this.observer = null;
    this.scannedCodes = new Set();
    this.scanInterval = null;
  }

  // Initialize scanner
  init() {
    console.log('QR Scanner initialized');
    this.startScanning();
    this.observeDOM();
  }

  // Start periodic scanning
  startScanning() {
    // Scan immediately
    this.scanPage();

    // Scan every 3 seconds for dynamic content
    this.scanInterval = setInterval(() => {
      this.scanPage();
    }, 3000);
  }

  // Scan page for QR codes
  async scanPage() {
    const images = document.querySelectorAll('img, canvas');
    
    for (const element of images) {
      try {
        await this.analyzeElement(element);
      } catch (error) {
        // Silent fail for individual elements
      }
    }
  }

  // Analyze single element for QR code
  async analyzeElement(element) {
    let imageData;

    if (element.tagName === 'IMG') {
      // Skip if already scanned
      if (this.scannedCodes.has(element.src)) return;

      // Check if image is likely a QR code (square-ish)
      const ratio = element.width / element.height;
      if (ratio < 0.5 || ratio > 2) return;

      // Check minimum size
      if (element.width < 100 || element.height < 100) return;

      imageData = await this.getImageData(element);
    } else if (element.tagName === 'CANVAS') {
      const ctx = element.getContext('2d');
      if (!ctx) return;

      imageData = ctx.getImageData(0, 0, element.width, element.height);
    } else {
      return;
    }

    // Try to decode QR code
    const result = this.decodeQR(imageData);
    
    if (result) {
      this.handleQRCode(result, element);
      if (element.src) {
        this.scannedCodes.add(element.src);
      }
    }
  }

  // Convert image to ImageData
  async getImageData(img) {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Handle CORS
      img.crossOrigin = 'anonymous';
      
      ctx.drawImage(img, 0, 0, img.width, img.height);
      
      try {
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        resolve(imageData);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Decode QR code using jsQR library
  decodeQR(imageData) {
    // Check if jsQR is available
    if (typeof jsQR === 'undefined') {
      console.warn('jsQR library not loaded. QR scanning disabled.');
      return null;
    }

    try {
      // Use jsQR to decode the QR code
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (code && code.data) {
        console.log('QR Code decoded:', code.data);
        return code.data;
      }

      return null;
    } catch (error) {
      console.error('Error decoding QR code:', error);
      return null;
    }
  }

  // Handle detected QR code
  handleQRCode(data, element) {
    console.log('QR Code detected:', data);

    // Parse payment information
    const paymentInfo = this.parsePaymentData(data);
    
    if (paymentInfo) {
      // Highlight the QR code
      this.highlightQRCode(element);

      // Send to background script
      chrome.runtime.sendMessage({
        action: 'qrCodeDetected',
        paymentInfo,
        url: window.location.href
      });

      // Show notification
      this.showNotification(paymentInfo);
    }
  }

  // Parse payment data from QR code
  parsePaymentData(data) {
    try {
      // Try to parse as JSON
      const json = JSON.parse(data);
      if (json.amount && json.address) {
        return {
          type: 'crypto',
          amount: json.amount,
          address: json.address,
          currency: json.currency || 'ZETA',
          memo: json.memo
        };
      }
    } catch (e) {
      // Not JSON, try other formats
    }

    // Check for crypto address patterns
    if (data.startsWith('0x') && data.length === 42) {
      return {
        type: 'crypto',
        address: data,
        currency: 'ETH'
      };
    }

    // Check for payment URI schemes
    if (data.startsWith('ethereum:') || data.startsWith('bitcoin:')) {
      return this.parsePaymentURI(data);
    }

    return null;
  }

  // Parse payment URI (e.g., ethereum:0x123...?amount=1.5)
  parsePaymentURI(uri) {
    try {
      const [protocol, rest] = uri.split(':');
      const [address, params] = rest.split('?');
      
      const paymentInfo = {
        type: 'crypto',
        address,
        currency: protocol.toUpperCase()
      };

      if (params) {
        const urlParams = new URLSearchParams(params);
        if (urlParams.has('amount')) {
          paymentInfo.amount = urlParams.get('amount');
        }
        if (urlParams.has('value')) {
          paymentInfo.amount = urlParams.get('value');
        }
      }

      return paymentInfo;
    } catch (e) {
      return null;
    }
  }

  // Highlight QR code on page
  highlightQRCode(element) {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: absolute;
      border: 3px solid #667eea;
      border-radius: 8px;
      pointer-events: none;
      z-index: 999998;
      box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.2);
      animation: qr-pulse 2s ease-in-out infinite;
    `;

    const rect = element.getBoundingClientRect();
    overlay.style.left = `${rect.left + window.scrollX}px`;
    overlay.style.top = `${rect.top + window.scrollY}px`;
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;

    // Add animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes qr-pulse {
        0%, 100% { box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.2); }
        50% { box-shadow: 0 0 0 8px rgba(102, 126, 234, 0.4); }
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(overlay);

    // Remove after 5 seconds
    setTimeout(() => overlay.remove(), 5000);
  }

  // Show notification
  showNotification(paymentInfo) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: white;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
      z-index: 999999;
      max-width: 300px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      border-left: 4px solid #667eea;
    `;

    notification.innerHTML = `
      <div style="font-size: 14px; font-weight: 600; color: #1f2937; margin-bottom: 4px;">
        📷 Payment QR Code Detected
      </div>
      <div style="font-size: 13px; color: #6b7280;">
        ${paymentInfo.amount ? `Amount: ${paymentInfo.amount} ${paymentInfo.currency}` : 'Address detected'}
      </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 5000);
  }

  // Observe DOM changes
  observeDOM() {
    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          // New content added, rescan
          this.scanPage();
          break;
        }
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Stop scanner
  stop() {
    if (this.scanInterval) {
      clearInterval(this.scanInterval);
    }
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

// Export for use in content script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = QRCodeScanner;
}
