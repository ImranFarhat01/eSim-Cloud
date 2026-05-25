# eSim Cloud — Audit Document
**Author:** Imran Farhat (ImranFarhat01)
**Date:** 25 May 2026
**Task:** Development of eSim on Cloud — FOSSEE Summer Fellowship 2026

---

## 1. Environment Setup

**System:** Ubuntu 24.04.4
**Tools Installed:**
- Docker 29.1.3
- Docker Compose 1.29.2
- Git (latest)

---

## 2. Repository Setup

- Forked FOSSEE/eSim-Cloud to ImranFarhat01/eSim-Cloud
- Cloned locally: git clone https://github.com/ImranFarhat01/eSim-Cloud.git
- Added upstream: git remote add upstream https://github.com/FOSSEE/eSim-Cloud.git
- Switched to develop branch: git checkout develop

---

## 3. Issues Faced and Fixes

### Issue 1 — PostgreSQL Version Incompatibility
**Error:** esim-cloud_db_1 container exited with error code 1.
**Error Message:**
  "Error: in 18+, these Docker images are configured to store database
  data in a format which is compatible with pg_ctlcluster"
**Root Cause:** docker-compose.dev.yml used image: postgres (latest = v18)
  which is incompatible with the project's data format.
**Fix:**
- Changed docker-compose.dev.yml: image: postgres → image: postgres:13
- Deleted old corrupted postgres_data folder: sudo rm -rf postgres_data
- Restarted all containers
**Result:** PostgreSQL 13 started successfully.

### Issue 2 — Database Migration Timing Error
**Error:** "could not translate host name db to address: Try again"
**Root Cause:** Django container started before PostgreSQL was fully ready.
  This caused the first_run.dev.sh script to fail during migrations.
**Fix:**
- Started containers manually: docker-compose -f docker-compose.dev.yml up -d
- Waited 30 seconds for PostgreSQL to fully initialize
- Ran migrations manually inside Django container:
  docker exec -it [django-container-id] /bin/bash
  sh migrations.sh
**Result:** All migrations completed successfully.
  "Installed 35 object(s) from 1 fixture(s)"

### Issue 3 — CairoSVG Warning (Non-Critical)
**Warning:** "Failed to import CairoSVG. drawSvg will be unable to output
  PNG or other raster image formats."
**Root Cause:** libcairo library not installed in the Docker container.
**Impact:** Does not affect circuit simulation or core functionality.
**Status:** Noted for future reference.

---

## 4. Current System State

### All 7 containers running successfully:
- esim-cloud_nginx_1          — Up (port 80)
- esim-cloud_eda-frontend      — Up (port 3000) — React eSim editor
- esim-cloud_arduino-frontend  — Up (port 4200) — Angular Arduino
- esim-cloud_django_1          — Up (port 8000) — Backend API
- esim-cloud_celery_1          — Up — Async simulation worker
- esim-cloud_db_1              — Up (port 5432) — PostgreSQL 13
- esim-cloud_redis_1           — Up (port 6379) — Job queue

### Verified Working:
- Home page: http://localhost/ ✓
- eSim editor: http://localhost/eda ✓
- Component list loads ✓
- Schematic canvas loads ✓
- Arduino simulator: http://localhost:4200 ✓
- Admin panel: http://localhost/api/admin ✓

---

## 5. Current Tech Stack

| Component      | Version        |
|----------------|----------------|
| Django         | 2.2.12         |
| React          | 16.14.0        |
| Angular        | 7.2.0          |
| PostgreSQL     | 13             |
| ngspice        | 31             |
| Node.js (CI)   | 10.5.0         |
| Celery         | 4.4.2          |
| Python         | 3.7            |

---

## 6. Repository Links

- My Fork: https://github.com/ImranFarhat01/eSim-Cloud
- Upstream (FOSSEE): https://github.com/FOSSEE/eSim-Cloud
- Original: https://github.com/frg-fossee/eSim-Cloud
- Documentation: https://esim-cloud.readthedocs.io
