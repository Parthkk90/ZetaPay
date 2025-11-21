// Settings page logic
let settings = {
  autoDetect: true,
  notifications: true,
  showButton: true,
  preferredNetwork: 'zetachain',
  txTimeout: 300,
  gasPreference: 'standard'
};

let priceAlerts = [];

// Load settings from storage
function loadSettings() {
  chrome.storage.local.get(['settings', 'priceAlerts'], (result) => {
    if (result.settings) {
      settings = { ...settings, ...result.settings };
    }
    
    if (result.priceAlerts) {
      priceAlerts = result.priceAlerts;
    }

    applySettings();
    renderAlerts();
  });
}

// Apply settings to UI
function applySettings() {
  // Toggle switches
  document.getElementById('autoDetect').classList.toggle('active', settings.autoDetect);
  document.getElementById('notifications').classList.toggle('active', settings.notifications);
  document.getElementById('showButton').classList.toggle('active', settings.showButton);

  // Network selection
  document.querySelectorAll('.network-card').forEach(card => {
    card.classList.toggle('active', card.dataset.network === settings.preferredNetwork);
  });

  // Advanced settings
  document.getElementById('txTimeout').value = settings.txTimeout;
  document.getElementById('gasPreference').value = settings.gasPreference;
}

// Save settings to storage
function saveSettings() {
  chrome.storage.local.set({ settings }, () => {
    console.log('Settings saved');
  });
}

// Toggle switches
document.querySelectorAll('.toggle').forEach(toggle => {
  toggle.addEventListener('click', () => {
    const settingName = toggle.id;
    settings[settingName] = !settings[settingName];
    toggle.classList.toggle('active', settings[settingName]);
    saveSettings();
  });
});

// Network selection
document.querySelectorAll('.network-card').forEach(card => {
  card.addEventListener('click', () => {
    settings.preferredNetwork = card.dataset.network;
    document.querySelectorAll('.network-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    saveSettings();
  });
});

// Price alerts
function renderAlerts() {
  const container = document.getElementById('alertsList');
  
  if (priceAlerts.length === 0) {
    container.innerHTML = '<p style="color: #6b7280; font-size: 14px;">No price alerts configured</p>';
    return;
  }

  container.innerHTML = priceAlerts.map((alert, index) => `
    <div class="alert-item">
      <div class="alert-details">
        <h4>${alert.token} Price Alert</h4>
        <p>Notify when price ${alert.condition || 'reaches'} $${alert.targetPrice}</p>
      </div>
      <button class="remove-btn" data-index="${index}">Remove</button>
    </div>
  `).join('');

  // Add remove listeners
  container.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.index);
      priceAlerts.splice(index, 1);
      chrome.storage.local.set({ priceAlerts }, () => {
        renderAlerts();
      });
    });
  });
}

// Add price alert
document.getElementById('addAlertBtn').addEventListener('click', () => {
  const token = document.getElementById('alertToken').value;
  const targetPrice = parseFloat(document.getElementById('targetPrice').value);

  if (!targetPrice || targetPrice <= 0) {
    alert('Please enter a valid price');
    return;
  }

  const alert = {
    token,
    targetPrice,
    condition: 'reaches',
    enabled: true,
    createdAt: Date.now()
  };

  priceAlerts.push(alert);
  
  chrome.storage.local.set({ priceAlerts }, () => {
    renderAlerts();
    document.getElementById('targetPrice').value = '';
    
    const successMsg = document.getElementById('alertSuccess');
    successMsg.style.display = 'block';
    setTimeout(() => {
      successMsg.style.display = 'none';
    }, 3000);
  });
});

// Advanced settings
document.getElementById('txTimeout').addEventListener('change', (e) => {
  settings.txTimeout = parseInt(e.target.value);
  saveSettings();
});

document.getElementById('gasPreference').addEventListener('change', (e) => {
  settings.gasPreference = e.target.value;
  saveSettings();
});

// Export data
document.getElementById('exportBtn').addEventListener('click', () => {
  chrome.storage.local.get(['transactions'], (result) => {
    const transactions = result.transactions || [];
    
    // Convert to CSV
    let csv = 'Date,Amount,Currency,Status,Transaction Hash\n';
    transactions.forEach(tx => {
      const date = new Date(tx.timestamp).toLocaleString();
      csv += `"${date}","${tx.amount || 'N/A'}","${tx.currency || 'N/A'}","${tx.status}","${tx.txHash || 'N/A'}"\n`;
    });

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zetapay-transactions-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  });
});

// Clear all data
document.getElementById('clearAllBtn').addEventListener('click', () => {
  if (confirm('⚠️ This will delete ALL your data including transactions, settings, and price alerts. This action cannot be undone. Continue?')) {
    chrome.storage.local.clear(() => {
      alert('✓ All data cleared successfully');
      location.reload();
    });
  }
});

// Initialize
loadSettings();
