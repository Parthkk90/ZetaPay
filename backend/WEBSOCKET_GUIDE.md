# ZetaPay WebSocket Integration Guide

## Overview
ZetaPay provides real-time payment updates via WebSocket connections using Socket.IO. This allows merchants to receive instant notifications when payments are created, updated, completed, or failed.

## Connection URL
```
ws://localhost:3001  (Development)
wss://api.zetapay.com  (Production)
```

## Authentication

WebSocket connections require API key authentication. Use your ZetaPay API key to authenticate:

```javascript
import { io } from 'socket.io-client';

const socket = io('ws://localhost:3001', {
  transports: ['websocket'],
  upgrade: false,
});

// Authenticate with your API key
socket.emit('auth', 'zpk_live_your_api_key_here');

// Listen for authentication success
socket.on('auth:success', (data) => {
  console.log('Authenticated as merchant:', data.merchantId);
});

// Listen for authentication failure
socket.on('auth:failed', (error) => {
  console.error('Authentication failed:', error);
});
```

## Available Events

### Client → Server Events

#### 1. Authenticate
```javascript
socket.emit('auth', apiKey);
```

#### 2. Subscribe to Specific Payment
```javascript
socket.emit('subscribe:payment', paymentId);
```

#### 3. Unsubscribe from Payment
```javascript
socket.emit('unsubscribe:payment', paymentId);
```

#### 4. Subscribe to All Merchant Payments
```javascript
socket.emit('subscribe:merchant', merchantId);
```

#### 5. Unsubscribe from Merchant Payments
```javascript
socket.emit('unsubscribe:merchant', merchantId);
```

### Server → Client Events

#### 1. Payment Created
Emitted when a new payment is created.

```javascript
socket.on('payment:created', (payment) => {
  console.log('New payment created:', payment);
  // {
  //   id: 'uuid',
  //   paymentReference: 'PAY-...',
  //   status: 'pending',
  //   amount: '100.00',
  //   currency: 'USD',
  //   ...
  // }
});
```

#### 2. Payment Updated
Emitted when a payment status or details are updated.

```javascript
socket.on('payment:updated', (payment) => {
  console.log('Payment updated:', payment);
  // Handle status change (pending → processing)
});
```

#### 3. Payment Completed
Emitted when a payment is successfully completed.

```javascript
socket.on('payment:completed', (payment) => {
  console.log('Payment completed:', payment);
  // Update UI, send confirmation email, etc.
});
```

#### 4. Payment Failed
Emitted when a payment fails.

```javascript
socket.on('payment:failed', (payment) => {
  console.log('Payment failed:', payment);
  // Handle failure, notify customer
});
```

#### 5. Transaction Confirmed
Emitted when a blockchain transaction is confirmed.

```javascript
socket.on('transaction:confirmed', (data) => {
  console.log('Transaction confirmed:', data);
  // {
  //   paymentId: 'uuid',
  //   txHash: '0x...',
  //   timestamp: '2025-11-11T...'
  // }
});
```

#### 6. Alert Created
Emitted when a new alert is triggered (AML, fraud, etc.).

```javascript
socket.on('alert:created', (alert) => {
  console.log('New alert:', alert);
  // {
  //   type: 'high_value_transaction',
  //   severity: 'medium',
  //   message: '...',
  //   paymentId: 'uuid'
  // }
});
```

#### 7. System Health
Broadcasted to all connected clients periodically.

```javascript
socket.on('system:health', (health) => {
  console.log('System health:', health);
  // {
  //   status: 'operational',
  //   activePayments: 5,
  //   processingQueue: 2
  // }
});
```

## Complete Example: React Integration

```tsx
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Payment {
  id: string;
  status: string;
  amount: string;
  currency: string;
  // ... other fields
}

export function usePaymentWebSocket(apiKey: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    // Initialize Socket.IO connection
    const newSocket = io(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001', {
      transports: ['websocket'],
      upgrade: false,
    });

    // Authenticate
    newSocket.on('connect', () => {
      console.log('Connected to WebSocket');
      newSocket.emit('auth', apiKey);
    });

    // Handle authentication
    newSocket.on('auth:success', (data) => {
      console.log('Authenticated:', data.merchantId);
      setConnected(true);
      // Subscribe to all merchant payments
      newSocket.emit('subscribe:merchant', data.merchantId);
    });

    newSocket.on('auth:failed', (error) => {
      console.error('Auth failed:', error);
      setConnected(false);
    });

    // Listen for payment events
    newSocket.on('payment:created', (payment: Payment) => {
      setPayments((prev) => [payment, ...prev]);
    });

    newSocket.on('payment:updated', (payment: Payment) => {
      setPayments((prev) =>
        prev.map((p) => (p.id === payment.id ? payment : p))
      );
    });

    newSocket.on('payment:completed', (payment: Payment) => {
      setPayments((prev) =>
        prev.map((p) => (p.id === payment.id ? payment : p))
      );
      // Show success notification
      alert(`Payment ${payment.id} completed!`);
    });

    newSocket.on('payment:failed', (payment: Payment) => {
      setPayments((prev) =>
        prev.map((p) => (p.id === payment.id ? payment : p))
      );
      // Show error notification
      alert(`Payment ${payment.id} failed!`);
    });

    // Handle disconnection
    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
      setConnected(false);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, [apiKey]);

  return { socket, connected, payments };
}

// Usage in component
export function PaymentDashboard() {
  const apiKey = 'zpk_live_your_api_key';
  const { socket, connected, payments } = usePaymentWebSocket(apiKey);

  return (
    <div>
      <h1>Real-time Payment Dashboard</h1>
      <p>Status: {connected ? '🟢 Connected' : '🔴 Disconnected'}</p>
      
      <h2>Recent Payments</h2>
      <ul>
        {payments.map((payment) => (
          <li key={payment.id}>
            {payment.id} - {payment.status} - {payment.amount} {payment.currency}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Node.js Example

```javascript
const io = require('socket.io-client');

const socket = io('ws://localhost:3001', {
  transports: ['websocket'],
});

// Authenticate
socket.on('connect', () => {
  console.log('Connected!');
  socket.emit('auth', 'zpk_live_your_api_key_here');
});

socket.on('auth:success', (data) => {
  console.log('Authenticated as:', data.merchantId);
  
  // Subscribe to all merchant payments
  socket.emit('subscribe:merchant', data.merchantId);
});

// Listen for payment events
socket.on('payment:created', (payment) => {
  console.log('💰 New payment:', payment.paymentReference);
});

socket.on('payment:completed', (payment) => {
  console.log('✅ Payment completed:', payment.paymentReference);
  // Process order, send confirmation email, etc.
});

socket.on('payment:failed', (payment) => {
  console.error('❌ Payment failed:', payment.paymentReference);
  // Handle failure
});

socket.on('alert:created', (alert) => {
  console.warn('⚠️  New alert:', alert.type, '-', alert.message);
  // Send notification to admin
});

// Handle errors
socket.on('error', (error) => {
  console.error('Socket error:', error);
});

socket.on('disconnect', () => {
  console.log('Disconnected');
});
```

## Best Practices

### 1. Reconnection Handling
Socket.IO automatically handles reconnections, but you should implement exponential backoff:

```javascript
const socket = io('ws://localhost:3001', {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});
```

### 2. Error Handling
Always implement error handlers:

```javascript
socket.on('error', (error) => {
  console.error('WebSocket error:', error);
  // Show user-friendly error message
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  // Retry or fallback to polling
});
```

### 3. Memory Management
Unsubscribe from events when component unmounts:

```javascript
useEffect(() => {
  const handlePaymentCreated = (payment) => {
    // Handle event
  };

  socket.on('payment:created', handlePaymentCreated);

  return () => {
    socket.off('payment:created', handlePaymentCreated);
  };
}, [socket]);
```

### 4. Security
- Always use WSS (WebSocket Secure) in production
- Never expose API keys in client-side code
- Implement rate limiting on client side
- Validate all incoming data

### 5. Performance
- Subscribe only to events you need
- Unsubscribe from specific payments when done
- Implement client-side caching to reduce updates

## Testing

### Test WebSocket Connection
```bash
npm install -g wscat
wscat -c ws://localhost:3001
```

### Send Authentication
```json
42["auth","zpk_test_your_api_key"]
```

### Monitor Events
Once authenticated, you'll receive real-time events in the console.

## Troubleshooting

### Connection Refused
- Check if backend server is running on port 3001
- Verify firewall rules
- Ensure WebSocket support is enabled

### Authentication Failed
- Verify API key is valid and active
- Check merchant account status is 'active'
- Ensure API key hasn't expired

### No Events Received
- Confirm you're subscribed to the correct merchant/payment
- Check that events are being emitted from backend
- Verify WebSocket service is initialized in server

### High Latency
- Check network connection
- Verify server load
- Consider using WebSocket compression

## API Endpoints for WebSocket Info

### Get Connection Stats
```bash
GET /api/v1/monitoring/websocket
Authorization: Bearer <jwt_token>

Response:
{
  "success": true,
  "data": {
    "totalConnections": 42,
    "authenticatedConnections": 38,
    "rooms": ["merchant:uuid1", "payment:uuid2", ...]
  }
}
```

## Migration from Polling

If currently using polling, migrate gradually:

```javascript
// Old: Polling every 5 seconds
setInterval(() => {
  fetch('/api/v1/payments')
    .then(res => res.json())
    .then(data => updateUI(data));
}, 5000);

// New: Real-time WebSocket
socket.on('payment:updated', (payment) => {
  updateUI(payment);
});
```

Benefits:
- ✅ Instant updates (no 5-second delay)
- ✅ Reduced server load (no polling requests)
- ✅ Lower bandwidth usage
- ✅ Better user experience

## Support

For issues or questions:
- GitHub Issues: https://github.com/Parthkk90/ZetaPay/issues
- Documentation: https://docs.zetapay.com
- Email: support@zetapay.com

---

**Last Updated:** November 11, 2025  
**Version:** 1.0.0  
**Socket.IO Version:** 4.7.2
