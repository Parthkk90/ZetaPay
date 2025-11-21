// ZetaPay API Client for Browser Extension
// Handles all communication with backend API

class ZetaPayAPI {
  constructor() {
    this.baseURL = 'http://localhost:3000/api/v1';
    this.token = null;
    this.user = null;
  }

  // Initialize API client
  async init() {
    // Load saved token and user from storage
    const data = await this.getStorage(['authToken', 'user']);
    this.token = data.authToken || null;
    this.user = data.user || null;
    
    console.log('ZetaPay API initialized', { hasToken: !!this.token, user: this.user?.walletAddress });
  }

  // Get from chrome storage
  async getStorage(keys) {
    return new Promise((resolve) => {
      chrome.storage.local.get(keys, resolve);
    });
  }

  // Save to chrome storage
  async setStorage(data) {
    return new Promise((resolve) => {
      chrome.storage.local.set(data, resolve);
    });
  }

  // Make authenticated request
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    // Add auth token if available
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `API Error: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // ============================================
  // AUTHENTICATION
  // ============================================

  async authenticate(walletAddress, signature = null, message = null) {
    try {
      const response = await this.request('/users/auth', {
        method: 'POST',
        body: JSON.stringify({
          walletAddress,
          signature,
          message,
        }),
      });

      if (response.success) {
        this.token = response.data.token;
        this.user = response.data.user;

        // Save to storage
        await this.setStorage({
          authToken: this.token,
          user: this.user,
        });

        console.log('User authenticated:', this.user.walletAddress);
        return response.data;
      }

      throw new Error('Authentication failed');
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  async logout() {
    this.token = null;
    this.user = null;
    await this.setStorage({
      authToken: null,
      user: null,
    });
    console.log('User logged out');
  }

  isAuthenticated() {
    return !!this.token && !!this.user;
  }

  // ============================================
  // USER MANAGEMENT
  // ============================================

  async getUserProfile() {
    try {
      const response = await this.request('/users/me');
      if (response.success) {
        this.user = response.data;
        await this.setStorage({ user: this.user });
        return response.data;
      }
      throw new Error('Failed to get user profile');
    } catch (error) {
      console.error('Get profile error:', error);
      throw error;
    }
  }

  async updateSettings(settings) {
    try {
      const response = await this.request('/users/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });

      if (response.success) {
        console.log('Settings updated');
        return response.data;
      }
      throw new Error('Failed to update settings');
    } catch (error) {
      console.error('Update settings error:', error);
      throw error;
    }
  }

  // ============================================
  // PAYMENTS
  // ============================================

  async createPayment(paymentData) {
    try {
      const response = await this.request('/payments/create', {
        method: 'POST',
        body: JSON.stringify({
          amount: paymentData.amount,
          currency: paymentData.currency || 'USD',
          source: 'crypto',
          orderId: paymentData.orderId,
          description: paymentData.description,
          customerEmail: paymentData.email,
          returnUrl: paymentData.returnUrl,
          metadata: {
            merchant: paymentData.merchant,
            extensionVersion: '0.3.0',
            detectedPlatform: paymentData.platform,
          },
        }),
      });

      if (response.success) {
        console.log('Payment created:', response.data.payment.reference);
        return response.data;
      }
      throw new Error('Failed to create payment');
    } catch (error) {
      console.error('Create payment error:', error);
      throw error;
    }
  }

  async getPaymentHistory(options = {}) {
    try {
      const params = new URLSearchParams({
        limit: options.limit || '50',
        offset: options.offset || '0',
        ...(options.status && { status: options.status }),
      });

      const response = await this.request(`/users/payments?${params}`);

      if (response.success) {
        return response.data;
      }
      throw new Error('Failed to get payment history');
    } catch (error) {
      console.error('Get payment history error:', error);
      throw error;
    }
  }

  async getPaymentStatus(paymentId) {
    try {
      const response = await this.request(`/users/payments/${paymentId}`);

      if (response.success) {
        return response.data;
      }
      throw new Error('Failed to get payment status');
    } catch (error) {
      console.error('Get payment status error:', error);
      throw error;
    }
  }

  async updatePaymentStatus(paymentId, status, txHash = null) {
    try {
      const response = await this.request(`/payments/${paymentId}/status`, {
        method: 'PUT',
        body: JSON.stringify({
          status,
          txHash,
        }),
      });

      if (response.success) {
        console.log(`Payment ${paymentId} updated to ${status}`);
        return response.data;
      }
      throw new Error('Failed to update payment status');
    } catch (error) {
      console.error('Update payment status error:', error);
      throw error;
    }
  }

  // ============================================
  // PRICE CONVERSION
  // ============================================

  async convertCurrency(amount, fromCurrency, toCurrency) {
    try {
      const response = await this.request('/payments/convert', {
        method: 'POST',
        body: JSON.stringify({
          amount,
          fromCurrency,
          toCurrency,
        }),
      });

      if (response.success) {
        return response.data;
      }
      throw new Error('Failed to convert currency');
    } catch (error) {
      console.error('Currency conversion error:', error);
      throw error;
    }
  }

  // ============================================
  // ANALYTICS
  // ============================================

  async getTransactionStats(period = '30d') {
    try {
      const response = await this.request(`/analytics/user-stats?period=${period}`);

      if (response.success) {
        return response.data;
      }
      throw new Error('Failed to get transaction stats');
    } catch (error) {
      console.error('Get stats error:', error);
      return null; // Return null on error for optional data
    }
  }
}

// Create singleton instance
const api = new ZetaPayAPI();

// Export for use in extension scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = api;
}
