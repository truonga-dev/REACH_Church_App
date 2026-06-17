# Deployment Guide - REACH Church Vietnam

**Comprehensive guide for deploying to staging and production environments**

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environments](#environments)
3. [Deployment Process](#deployment-process)
4. [Monitoring & Alerts](#monitoring--alerts)
5. [Rollback Procedures](#rollback-procedures)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools

```bash
# Docker
docker --version  # ≥ 20.10

# Kubernetes CLI
kubectl version --client  # ≥ 1.28

# Helm (optional but recommended)
helm version  # ≥ 3.10

# Git
git --version  # ≥ 2.40

# Cloud CLI (based on your provider)
# AWS: aws --version
# GCP: gcloud --version
# Azure: az --version
```

### Access Requirements

- Kubernetes cluster access
- Docker registry credentials
- Supabase project access
- GitHub write permissions
- Monitoring/alerting access

### Environment Setup

```bash
# Configure kubectl context
kubectl config use-context reach-church-prod

# Verify access
kubectl cluster-info
kubectl get nodes
```

---

## Environments

### Development

```
Branch: any feature branch
Trigger: Manual (npm run dev)
URL: http://localhost:3000
Database: Local Supabase or dev project
Deployment: Local machine
```

### Staging

```
Branch: develop
Trigger: Auto (push to develop)
URL: https://staging.reach-church.com
Database: Supabase staging project
Deployment: Kubernetes cluster (minimal)
```

### Production

```
Branch: main
Trigger: Auto (push to main / manual)
URL: https://reach-church.com
Database: Supabase production project
Deployment: Kubernetes cluster (HA)
```

---

## Deployment Process

### Step 1: Prepare Release

```bash
# 1. Create release branch
git checkout develop
git pull origin develop
git checkout -b release/v0.2.0

# 2. Update version
# Edit package.json
"version": "0.2.0"

# 3. Update CHANGELOG
cat >> CHANGELOG.md << 'EOF'
## [0.2.0] - 2026-06-10

### Added
- New feature description

### Fixed
- Bug fix description

### Changed
- Breaking change (if any)
EOF

# 4. Commit changes
git add package.json CHANGELOG.md
git commit -m "chore(release): v0.2.0"

# 5. Create PR to main
git push origin release/v0.2.0
# Create PR on GitHub
```

### Step 2: Automated CI/CD Pipeline

The GitHub Actions pipeline automatically runs:

```
1. Lint & Type Check (5 mins)
   ├─ ESLint
   └─ TypeScript

2. Build Application (10 mins)
   ├─ npm install
   ├─ npm build
   └─ Save artifacts

3. Run Tests (10 mins)
   ├─ Unit tests
   └─ Integration tests

4. Security Scan (5 mins)
   ├─ Dependency scan
   └─ Code analysis

5. Build Docker Image (10 mins)
   ├─ Build image
   └─ Push to registry

6. Deploy to Staging (15 mins)
   ├─ kubectl set image
   ├─ Wait for rollout
   └─ Run smoke tests

7. Deploy to Production (15 mins - manual approval)
   ├─ kubectl set image
   ├─ Wait for rollout
   ├─ Run health checks
   └─ Notify team
```

**Total Time:** ~70 minutes

### Step 3: Manual Deployment (if automated fails)

#### Deploy to Staging

```bash
# 1. Build Docker image
docker build -t reach-church:staging-$(git rev-parse --short HEAD) .

# 2. Tag for registry
docker tag reach-church:staging-* ghcr.io/truonga-dev/reach_church_app:staging

# 3. Push to registry
docker push ghcr.io/truonga-dev/reach_church_app:staging

# 4. Update Kubernetes
kubectl set image deployment/reach-church-app \
  reach-church=ghcr.io/truonga-dev/reach_church_app:staging \
  -n staging \
  --record

# 5. Wait for rollout
kubectl rollout status deployment/reach-church-app -n staging

# 6. Run smoke tests
curl -f https://staging.reach-church.com/api/health
```

#### Deploy to Production

```bash
# 1. Build Docker image
docker build -t reach-church:prod-$(date +%Y%m%d-%H%M%S) .

# 2. Tag for registry
docker tag reach-church:prod-* ghcr.io/truonga-dev/reach_church_app:latest

# 3. Push to registry
docker push ghcr.io/truonga-dev/reach_church_app:latest

# 4. Check current deployment
kubectl get deployment reach-church-app -n production
kubectl get pods -n production -l app=reach-church

# 5. Update Kubernetes
kubectl set image deployment/reach-church-app \
  reach-church=ghcr.io/truonga-dev/reach_church_app:latest \
  -n production \
  --record

# 6. Wait for rollout (with timeout)
kubectl rollout status deployment/reach-church-app \
  -n production \
  --timeout=5m

# 7. Verify deployment
kubectl get pods -n production -l app=reach-church
kubectl logs -f -n production -l app=reach-church --tail=50

# 8. Run health checks
curl -f https://reach-church.com/api/health

# 9. Check metrics
kubectl top pods -n production -l app=reach-church
kubectl top nodes
```

---

## Blue-Green Deployment (Advanced)

For zero-downtime deployments:

```bash
# 1. Deploy new version as "green"
kubectl create deployment reach-church-green \
  --image=ghcr.io/truonga-dev/reach_church_app:new-version \
  -n production

# 2. Wait for green to be ready
kubectl wait --for=condition=Ready pod \
  -l app=reach-church-green \
  -n production \
  --timeout=300s

# 3. Run tests on green
curl -f http://reach-church-green/api/health

# 4. Switch traffic to green
kubectl patch service reach-church-app \
  -n production \
  -p '{"spec":{"selector":{"app":"reach-church-green"}}}'

# 5. Monitor for issues
kubectl logs -f -n production -l app=reach-church-green

# 6. Keep blue for quick rollback
# If issues, switch back to blue:
kubectl patch service reach-church-app \
  -n production \
  -p '{"spec":{"selector":{"app":"reach-church-blue"}}}'

# 7. After 24-48 hours, delete blue
kubectl delete deployment reach-church-blue -n production
```

---

## Monitoring & Alerts

### Check Deployment Status

```bash
# Check rollout status
kubectl rollout status deployment/reach-church-app -n production

# Check pod status
kubectl get pods -n production -l app=reach-church

# View events
kubectl describe deployment reach-church-app -n production

# Check logs
kubectl logs -f deployment/reach-church-app -n production
```

### Monitoring Dashboards

**Sentry (Error Tracking):**
- URL: https://sentry.io/reach-church/
- Check: Error rates, stack traces

**DataDog (Performance):**
- URL: https://app.datadoghq.com/
- Check: Response times, CPU, memory

**Prometheus (Metrics):**
- URL: http://prometheus:9090
- Check: Custom metrics

**Grafana (Visualization):**
- URL: http://grafana:3000
- Check: Dashboards, alerts

### Alert Rules

```
- Error rate > 5%        → Page DevOps team
- Response time > 1s     → Email alert
- CPU usage > 80%        → Investigate
- Memory > 85%           → Scale up
- Deployment failed      → Notify team
```

---

## Rollback Procedures

### Automatic Rollback

If deployment fails health checks, automatic rollback occurs:

```bash
# Automatically triggered after 3 failed health checks
# Within 5 minutes
kubectl rollout undo deployment/reach-church-app -n production
```

### Manual Rollback

```bash
# 1. Check rollout history
kubectl rollout history deployment/reach-church-app -n production

# 2. See specific revision details
kubectl rollout history deployment/reach-church-app \
  -n production \
  --revision=3

# 3. Rollback to previous version
kubectl rollout undo deployment/reach-church-app -n production

# 4. Rollback to specific revision
kubectl rollout undo deployment/reach-church-app \
  -n production \
  --to-revision=3

# 5. Wait for rollback to complete
kubectl rollout status deployment/reach-church-app \
  -n production \
  --timeout=5m

# 6. Verify
curl -f https://reach-church.com/api/health
```

### Rollback with Database Issues

If database migration caused issues:

```bash
# 1. Rollback application first
kubectl rollout undo deployment/reach-church-app -n production

# 2. Connect to Supabase
# Navigate to: https://supabase.com/dashboard

# 3. Check recent migrations
# SQL Editor → Recent queries

# 4. Revert migration manually or run rollback script
# psql -U postgres -d reach_church < rollback.sql

# 5. Verify data integrity
# Run sanity checks on affected tables
```

---

## Troubleshooting

### Issue 1: Pods in CrashLoopBackOff

**Symptoms:**
```
reach-church-app-xxx   0/1   CrashLoopBackOff   5 (1m ago)   5m
```

**Diagnosis:**
```bash
# Check logs
kubectl logs reach-church-app-xxx -n production --previous

# Check events
kubectl describe pod reach-church-app-xxx -n production

# Check environment variables
kubectl get configmap reach-church-config -n production -o yaml
kubectl get secret reach-church-secrets -n production -o yaml
```

**Solutions:**
1. Check environment variables are set correctly
2. Verify Supabase connection
3. Check image pull policy
4. Increase pod resources

### Issue 2: Slow Deployment

**Symptoms:**
```
kubectl rollout status deployment/reach-church-app -n production
# Stuck waiting for new pods
```

**Diagnosis:**
```bash
# Check pod events
kubectl describe pod reach-church-app-new -n production

# Check node resources
kubectl top nodes
kubectl top pods -n production

# Check image pull
kubectl get events -n production --sort-by='.lastTimestamp'
```

**Solutions:**
1. Increase node resources
2. Pull image to cache ahead of time
3. Reduce pod resource requests
4. Increase deployment timeout

### Issue 3: High Error Rate After Deploy

**Symptoms:**
```
Sentry shows error rate spike
Database query latency increased
API responses slow
```

**Solutions:**
1. Check database connections
2. Review recent code changes
3. Monitor memory leaks
4. Check third-party API status
5. Rollback if necessary

### Issue 4: Database Migrations Failed

**Symptoms:**
```
Supabase migration error
Schema mismatch
Data inconsistency
```

**Solutions:**
```bash
# 1. Check Supabase dashboard for errors
# 2. View migration history
psql -U postgres -d reach_church

# 3. Check current schema
\dt  # List tables
\d user_profiles  # Describe table

# 4. Check recent migrations
SELECT id, name, statements FROM schema_migrations ORDER BY id DESC LIMIT 5;

# 5. Rollback migration if necessary
# Via Supabase dashboard or manual SQL
```

---

## Maintenance

### Regular Maintenance Tasks

```bash
# Weekly
- Review error logs
- Check disk usage: kubectl top nodes
- Verify backups: Supabase dashboard

# Monthly
- Review performance metrics
- Update dependencies: npm audit
- Clean up old Docker images: docker image prune

# Quarterly
- Security audit: npm audit
- Performance optimization
- Disaster recovery drill
```

### Backup & Recovery

```bash
# Supabase automatically backs up daily
# Manual backup (optional)
pg_dump reach_church > backup_$(date +%Y%m%d).sql

# Restore from backup
psql reach_church < backup_20260605.sql
```

---

## Deployment Checklist

Before Each Deployment:

- [ ] All tests pass
- [ ] Code review completed
- [ ] No breaking changes (or documented)
- [ ] Database migrations tested locally
- [ ] Staging deployment successful
- [ ] Team notified
- [ ] Monitoring alerts active
- [ ] Rollback plan ready
- [ ] On-call engineer standing by

After Deployment:

- [ ] Health checks passing
- [ ] Error rate normal
- [ ] Performance metrics normal
- [ ] User reports collected
- [ ] Logs monitored for 1 hour
- [ ] Team informed of success
- [ ] Post-deployment review scheduled

---

## Support & Escalation

**On-Call Escalation:**

```
Dev team → Manager → Architect → Director

Critical issue? Call on-call engineer immediately
```

**Contact:**
- 📧 ops@reach-church.com
- 📞 +84-XXX-XXXX
- 💬 #devops Slack channel

---

**Last Updated:** June 5, 2026  
**Version:** 1.0.0  
**Next Review:** September 5, 2026
