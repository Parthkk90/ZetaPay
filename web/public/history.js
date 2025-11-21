// Transaction history page logic
let allTransactions = [];
let currentFilter = 'all';

// Load transactions from storage
async function loadTransactions() {
  chrome.storage.local.get(['transactions'], (result) => {
    allTransactions = result.transactions || [];
    updateStats();
    renderTransactions();
  });
}

// Update statistics
function updateStats() {
  const totalTxs = allTransactions.length;
  const successTxs = allTransactions.filter(tx => tx.status === 'success').length;
  const totalVolume = allTransactions
    .filter(tx => tx.status === 'success' && tx.amount)
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

  document.getElementById('totalTxs').textContent = totalTxs;
  document.getElementById('successTxs').textContent = successTxs;
  document.getElementById('totalVolume').textContent = totalVolume.toFixed(2);
}

// Filter transactions
function filterTransactions() {
  let filtered = allTransactions;

  if (currentFilter === 'success') {
    filtered = allTransactions.filter(tx => tx.status === 'success');
  } else if (currentFilter === 'failed') {
    filtered = allTransactions.filter(tx => tx.status === 'failed');
  } else if (currentFilter === 'today') {
    const today = new Date().setHours(0, 0, 0, 0);
    filtered = allTransactions.filter(tx => 
      new Date(tx.timestamp).setHours(0, 0, 0, 0) === today
    );
  }

  return filtered;
}

// Render transactions
function renderTransactions() {
  const container = document.getElementById('transactionList');
  const filtered = filterTransactions();

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
        </svg>
        <h3>No transactions found</h3>
        <p>Try adjusting your filters</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(tx => {
    const date = new Date(tx.timestamp);
    const dateStr = date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const icon = tx.status === 'success' ? '✓' : '✗';
    const iconClass = tx.status === 'success' ? 'success' : 'failed';
    
    return `
      <div class="transaction">
        <div class="tx-left">
          <div class="tx-icon ${iconClass}">${icon}</div>
          <div class="tx-details">
            <h3>${tx.amount || 'N/A'} ${tx.currency || 'USD'}</h3>
            <p>
              ${tx.txHash 
                ? `<span class="tx-hash" onclick="openExplorer('${tx.txHash}')">${tx.txHash.slice(0, 20)}...</span>` 
                : tx.error || 'Transaction details'}
            </p>
          </div>
        </div>
        <div class="tx-right">
          <div class="tx-amount">${tx.amount ? `$${tx.amount}` : 'Failed'}</div>
          <div class="tx-date">${dateStr}</div>
          <span class="status-badge ${iconClass}">${tx.status}</span>
        </div>
      </div>
    `;
  }).join('');
}

// Open block explorer
function openExplorer(txHash) {
  const explorerUrl = `https://athens.explorer.zetachain.com/tx/${txHash}`;
  chrome.tabs.create({ url: explorerUrl });
}

// Clear history
document.getElementById('clearBtn').addEventListener('click', () => {
  if (confirm('Are you sure you want to clear all transaction history?')) {
    chrome.storage.local.set({ transactions: [] }, () => {
      allTransactions = [];
      updateStats();
      renderTransactions();
      
      // Update badge
      chrome.runtime.sendMessage({ action: 'clearHistory' });
    });
  }
});

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTransactions();
  });
});

// Initialize
loadTransactions();
