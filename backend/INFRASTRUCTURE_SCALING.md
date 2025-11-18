# Infrastructure Scaling Configuration

## Overview
This document outlines the infrastructure scaling strategy for ZetaPay, including Redis caching, database connection pooling, and load balancing configuration.

## Redis Caching

### Setup
```bash
# Install Redis (Windows)
# Download from: https://redis.io/download
# Or use Docker:
docker run --name zetapay-redis -p 6379:6379 -d redis:alpine

# Install Redis (Linux/Mac)
sudo apt-get install redis-server  # Ubuntu/Debian
brew install redis                 # macOS
```

### Configuration
Add to `backend/.env`:
```env
REDIS_URL=redis://localhost:6379
```

### Usage
The Redis cache service provides:
- **Payment caching**: Cache frequently accessed payment data
- **Session management**: Store user sessions
- **Rate limiting**: Distributed rate limit counters
- **Analytics caching**: Cache analytics queries
- **API response caching**: Cache merchant/payment API responses

### Cache Keys
- `payment:{id}` - Payment details
- `merchant:{id}` - Merchant details
- `analytics:{merchantId}:{metric}` - Analytics data
- `rate_limit:{ip}:{endpoint}` - Rate limit counters

### Default TTL
- Payment data: 1 hour
- Merchant data: 4 hours
- Analytics: 15 minutes
- Rate limits: 1 minute

## Database Connection Pooling

### PostgreSQL Configuration
Add to `backend/.env`:
```env
# Connection Pool Settings
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_POOL_IDLE_TIMEOUT=30000
DB_POOL_ACQUIRE_TIMEOUT=60000
```

### TypeORM Configuration
Update `src/db/connection.ts`:
```typescript
{
  type: 'postgres',
  // ... other config
  extra: {
    max: 10,                    // Maximum connections
    min: 2,                     // Minimum connections
    idleTimeoutMillis: 30000,   // Close idle connections after 30s
    connectionTimeoutMillis: 2000,
  },
}
```

### Recommendations
- **Development**: 2-5 connections
- **Staging**: 5-10 connections
- **Production**: 10-20 connections per instance

## Load Balancing

### Nginx Configuration
Create `nginx/zetapay.conf`:
```nginx
upstream zetapay_backend {
    least_conn;
    server backend1:3001 weight=1 max_fails=3 fail_timeout=30s;
    server backend2:3001 weight=1 max_fails=3 fail_timeout=30s;
    server backend3:3001 weight=1 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name api.zetapay.io;

    location /api {
        proxy_pass http://zetapay_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket support
    location /socket.io {
        proxy_pass http://zetapay_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Health Checks

### Endpoint Configuration
The `/health` endpoint provides:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "websocket": "running"
  },
  "metrics": {
    "uptime": 86400,
    "memory": "512MB",
    "cpu": "15%"
  }
}
```

### Kubernetes Health Checks
```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 3001
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health
    port: 3001
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
  failureThreshold: 2
```

## Horizontal Scaling

### Docker Compose
```yaml
version: '3.8'

services:
  backend:
    image: zetapay-backend:latest
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
      - DATABASE_URL=postgresql://postgres:password@db:5432/zetapay
    depends_on:
      - redis
      - db

  redis:
    image: redis:alpine
    volumes:
      - redis_data:/data

  db:
    image: postgres:14
    environment:
      - POSTGRES_DB=zetapay
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/zetapay.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - backend

volumes:
  redis_data:
  postgres_data:
```

## Performance Optimization

### 1. Response Caching Middleware
```typescript
// Cache GET requests for merchants
app.get('/api/v1/merchants/:id', cacheMiddleware(3600), getMerchant);
```

### 2. Database Query Optimization
- Use indexes on frequently queried fields
- Implement query result caching
- Use pagination for large datasets
- Eager load relations when needed

### 3. Rate Limiting
```typescript
// Distributed rate limiting with Redis
const rateLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate_limit:',
  }),
  windowMs: 60000,
  max: 100,
});
```

## Monitoring

### Metrics to Track
1. **Request Rate**: Requests per second
2. **Response Time**: Average/P95/P99 latency
3. **Error Rate**: 4xx/5xx error percentage
4. **Cache Hit Rate**: Redis cache effectiveness
5. **Database Connections**: Active/idle connections
6. **Memory Usage**: Per instance
7. **CPU Usage**: Per instance

### Tools
- **Prometheus**: Metrics collection
- **Grafana**: Visualization
- **New Relic / DataDog**: APM
- **CloudWatch**: AWS monitoring

## Scaling Targets

### Current Capacity (Single Instance)
- 100 req/s
- 1000 concurrent connections
- 10ms average response time

### Production Target (3 Instances)
- 300 req/s
- 3000 concurrent connections
- 15ms average response time

### High Availability
- Minimum 3 instances across availability zones
- Auto-scaling: Scale up at 70% CPU, scale down at 30%
- Rolling deployments with zero downtime
- Database replication (master-replica)

## Security Considerations

1. **Redis**: Enable authentication, use TLS
2. **Database**: Use connection pooling, prepared statements
3. **Load Balancer**: SSL termination, DDoS protection
4. **Rate Limiting**: Distributed counters to prevent abuse

## Disaster Recovery

### Backup Strategy
- **Database**: Daily automated backups, 30-day retention
- **Redis**: RDB snapshots every 6 hours
- **Logs**: Centralized logging with 90-day retention

### Recovery Plan
1. Restore database from latest backup
2. Restart backend instances
3. Clear Redis cache
4. Run health checks
5. Monitor for 1 hour

## Implementation Checklist

- [x] Redis cache service implementation
- [x] Connection pooling configuration
- [ ] Nginx load balancer setup
- [ ] Docker compose orchestration
- [ ] Health check endpoints
- [ ] Monitoring dashboard
- [ ] Auto-scaling policies
- [ ] Disaster recovery testing

## Next Steps

1. Deploy Redis instance
2. Update connection pool settings
3. Configure load balancer
4. Set up monitoring
5. Perform load testing
6. Document SLAs
