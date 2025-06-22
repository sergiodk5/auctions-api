# Status Routes Guide

## Overview

Status routes provide health check and system monitoring endpoints. These are typically public endpoints used by load balancers, monitoring systems, and health checks to verify that the API is operational.

## Route Structure

### Status Router Setup

```typescript
// src/routes/status.route.ts
import express from "express";

const statusRoute = express.Router();

statusRoute.get("/", (_req, res, _next) => {
    res.status(200).json({ status: "healthy" });
});

export default statusRoute;
```

## Status Endpoints

### Health Check

```typescript
// GET /api/v1/status
statusRoute.get("/", (_req, res, _next) => {
    res.status(200).json({ status: "healthy" });
});
```

**Purpose**: Basic health check endpoint
**Authentication**: None required (public endpoint)
**Authorization**: None required
**Validation**: None

**Response**:

```typescript
// Success (200 OK)
{
    status: "healthy";
}
```

## Characteristics

### Public Access

The status routes are intentionally public and do not require:

- Authentication
- Authorization
- Rate limiting
- Input validation

This ensures they can be used by:

- Load balancers for health checks
- Monitoring systems for uptime verification
- Container orchestration platforms (Docker, Kubernetes)
- CI/CD pipelines for deployment verification

### Minimal Dependencies

The status endpoint is implemented with minimal dependencies to reduce the chance of failure:

- No database connections
- No external service calls
- No complex business logic
- No dependency injection

## Enhanced Health Check Implementation

### Comprehensive Health Check

For production systems, you might want a more comprehensive health check:

```typescript
// src/routes/status.route.ts (enhanced version)
import express from "express";
import { inject, injectable } from "inversify";
import { TYPES } from "@/di/types";
import { IDatabaseService } from "@/services/database.service";
import { ICacheService } from "@/services/cache.service";

interface HealthStatus {
    status: "healthy" | "unhealthy" | "degraded";
    timestamp: string;
    version?: string;
    uptime: number;
    checks: {
        database: "up" | "down";
        cache: "up" | "down";
        memory: {
            used: number;
            total: number;
            percentage: number;
        };
    };
}

const statusRoute = express.Router();

// Basic health check (no dependencies)
statusRoute.get("/", (_req, res) => {
    res.status(200).json({ status: "healthy" });
});

// Detailed health check (with dependencies)
statusRoute.get("/detailed", async (_req, res) => {
    const startTime = Date.now();
    const healthStatus: HealthStatus = {
        status: "healthy",
        timestamp: new Date().toISOString(),
        version: process.env.APP_VERSION || "unknown",
        uptime: process.uptime(),
        checks: {
            database: "down",
            cache: "down",
            memory: {
                used: 0,
                total: 0,
                percentage: 0,
            },
        },
    };

    try {
        // Check database connectivity
        const databaseService = container.get<IDatabaseService>(TYPES.IDatabaseService);
        await databaseService.db.select().from(users).limit(1);
        healthStatus.checks.database = "up";
    } catch (error) {
        healthStatus.status = "degraded";
        healthStatus.checks.database = "down";
    }

    try {
        // Check cache connectivity
        const cacheService = container.get<ICacheService>(TYPES.ICacheService);
        await cacheService.set("health_check", "test", 10);
        await cacheService.get("health_check");
        healthStatus.checks.cache = "up";
    } catch (error) {
        healthStatus.status = "degraded";
        healthStatus.checks.cache = "down";
    }

    // Memory usage
    const memUsage = process.memoryUsage();
    healthStatus.checks.memory = {
        used: memUsage.heapUsed,
        total: memUsage.heapTotal,
        percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
    };

    // Determine overall status
    const allChecksUp = healthStatus.checks.database === "up" && healthStatus.checks.cache === "up";

    if (!allChecksUp && healthStatus.status === "healthy") {
        healthStatus.status = "degraded";
    }

    const statusCode = healthStatus.status === "healthy" ? 200 : healthStatus.status === "degraded" ? 200 : 503;

    res.status(statusCode).json(healthStatus);
});

export default statusRoute;
```

### Readiness vs Liveness

For Kubernetes deployments, you might want separate endpoints:

```typescript
// Liveness probe - is the application running?
statusRoute.get("/live", (_req, res) => {
    res.status(200).json({ status: "alive" });
});

// Readiness probe - is the application ready to serve traffic?
statusRoute.get("/ready", async (_req, res) => {
    try {
        // Check if all critical dependencies are available
        await checkDatabaseConnection();
        await checkCacheConnection();

        res.status(200).json({ status: "ready" });
    } catch (error) {
        res.status(503).json({
            status: "not ready",
            error: "Dependencies unavailable",
        });
    }
});
```

## Testing Status Routes

### Integration Test

```typescript
// tests/integration/routes/status.integration.test.ts
import app from "@/app";
import request from "supertest";

describe("Status Routes", () => {
    describe("GET /api/v1/status", () => {
        it("should return healthy status", async () => {
            const response = await request(app).get("/api/v1/status");

            expect(response.status).toBe(200);
            expect(response.body).toEqual({ status: "healthy" });
        });

        it("should not require authentication", async () => {
            const response = await request(app).get("/api/v1/status");

            // Should not return 401 Unauthorized
            expect(response.status).not.toBe(401);
            expect(response.status).toBe(200);
        });

        it("should respond quickly", async () => {
            const startTime = Date.now();
            const response = await request(app).get("/api/v1/status");
            const responseTime = Date.now() - startTime;

            expect(response.status).toBe(200);
            expect(responseTime).toBeLessThan(100); // Should respond in < 100ms
        });
    });

    describe("GET /api/v1/status/detailed", () => {
        it("should return detailed health information", async () => {
            const response = await request(app).get("/api/v1/status/detailed");

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty("status");
            expect(response.body).toHaveProperty("timestamp");
            expect(response.body).toHaveProperty("uptime");
            expect(response.body).toHaveProperty("checks");
            expect(response.body.checks).toHaveProperty("database");
            expect(response.body.checks).toHaveProperty("cache");
            expect(response.body.checks).toHaveProperty("memory");
        });
    });
});
```

## Monitoring Integration

### Prometheus Metrics

You can extend status routes to provide metrics for Prometheus:

```typescript
statusRoute.get("/metrics", (_req, res) => {
    const metrics = `
# HELP app_up Application is running
# TYPE app_up gauge
app_up 1

# HELP app_uptime_seconds Application uptime in seconds
# TYPE app_uptime_seconds counter
app_uptime_seconds ${process.uptime()}

# HELP app_memory_usage_bytes Memory usage in bytes
# TYPE app_memory_usage_bytes gauge
app_memory_usage_bytes ${process.memoryUsage().heapUsed}
    `;

    res.set("Content-Type", "text/plain");
    res.send(metrics);
});
```

### Application Performance Monitoring (APM)

Status endpoints can include APM integration:

```typescript
statusRoute.get("/apm", (_req, res) => {
    const apmData = {
        status: "healthy",
        performance: {
            responseTime: {
                avg: 150,
                p95: 300,
                p99: 500,
            },
            throughput: {
                requestsPerSecond: 100,
                requestsPerMinute: 6000,
            },
            errorRate: 0.01,
        },
        resources: {
            cpu: process.cpuUsage(),
            memory: process.memoryUsage(),
            eventLoop: process.hrtime(),
        },
    };

    res.json(apmData);
});
```

## Security Considerations

### Information Disclosure

Be careful about what information you expose in status endpoints:

```typescript
// Good: Minimal information for public health checks
{
    status: "healthy"
}

// Bad: Too much internal information exposed
{
    status: "healthy",
    database: {
        host: "db.internal.company.com",
        port: 5432,
        username: "api_user",
        connectionPool: {
            active: 10,
            idle: 5,
            total: 15
        }
    },
    internalVersion: "v1.2.3-internal-build-12345",
    secrets: {
        // Never expose secrets!
    }
}
```

### Rate Limiting Considerations

While status endpoints typically don't need rate limiting, you might want to implement it for detailed health checks to prevent abuse:

```typescript
// For detailed health checks that might be expensive
statusRoute.get(
    "/detailed",
    rateLimiter({ windowMs: 60000, max: 10 }), // 10 requests per minute
    detailedHealthCheck,
);
```

## Best Practices

### Status Endpoint Design

1. **Keep It Simple**: Basic health checks should be as simple as possible
2. **Fast Response**: Health checks should respond quickly (< 100ms)
3. **No Dependencies**: Basic health checks shouldn't depend on external services
4. **Consistent Format**: Use consistent response format across all status endpoints
5. **Appropriate Status Codes**: Use HTTP status codes that monitoring systems understand

### Production Considerations

1. **Multiple Endpoints**: Provide both basic and detailed health checks
2. **Caching**: Consider caching detailed health check results
3. **Timeouts**: Implement timeouts for dependency checks
4. **Graceful Degradation**: Continue serving traffic even when some dependencies are down
5. **Monitoring Integration**: Integrate with your monitoring and alerting systems

### Container Orchestration

For Docker/Kubernetes deployments:

```dockerfile
# Dockerfile
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/v1/status || exit 1
```

```yaml
# Kubernetes deployment
apiVersion: v1
kind: Pod
spec:
    containers:
        - name: api
          image: my-api:latest
          livenessProbe:
              httpGet:
                  path: /api/v1/status
                  port: 3000
              initialDelaySeconds: 30
              periodSeconds: 30
          readinessProbe:
              httpGet:
                  path: /api/v1/status/ready
                  port: 3000
              initialDelaySeconds: 5
              periodSeconds: 10
```

## Common Use Cases

### Load Balancer Health Checks

```bash
# Load balancer configuration
upstream api_servers {
    server api1.example.com:3000;
    server api2.example.com:3000;
    server api3.example.com:3000;
}

# Health check configuration
location /health {
    access_log off;
    return 200 "healthy\n";
    add_header Content-Type text/plain;
}
```

### CI/CD Pipeline Verification

```bash
# Deployment script
echo "Deploying application..."
kubectl apply -f deployment.yaml

echo "Waiting for deployment to be ready..."
while ! curl -f http://api.example.com/api/v1/status; do
    echo "Waiting for API to be healthy..."
    sleep 5
done

echo "Deployment successful!"
```

### Monitoring System Integration

```bash
# Monitoring script
#!/bin/bash
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://api.example.com/api/v1/status)

if [ $RESPONSE -eq 200 ]; then
    echo "API is healthy"
    exit 0
else
    echo "API is unhealthy (HTTP $RESPONSE)"
    exit 1
fi
```

## Related Documentation

- [Main Routes Guide](./routes.guide.md)
- [Middleware Guide](../middlewares/middlewares.guide.md)
- [Integration Testing Guide](../testing.md)
- [Docker Configuration](../../compose.yml)
- [CI/CD Guide](../ci-cd.md)
