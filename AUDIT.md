# eSim Cloud - Audit Document
**Author:** Imran Farhat (ImranFarhat01)
**Date:** 25 May 2026
**Task:** Development of eSim on Cloud - FOSSEE Summer Fellowship 2026

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

## 3. Setup Issues Faced and Fixes

### Issue 1 - PostgreSQL Version Incompatibility
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

### Issue 2 - Database Migration Timing Error
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

---

## 4. Current System State

### All 7 containers running successfully:
- esim-cloud_nginx_1          - Up (port 80)
- esim-cloud_eda-frontend      - Up (port 3000) - React eSim editor
- esim-cloud_arduino-frontend  - Up (port 4200) - Angular Arduino
- esim-cloud_django_1          - Up (port 8000) - Backend API
- esim-cloud_celery_1          - Up - Async simulation worker
- esim-cloud_db_1              - Up (port 5432) - PostgreSQL 13
- esim-cloud_redis_1           - Up (port 6379) - Job queue

---

## 5. Features Tested

### Working Features ✅
1. eSim editor loads correctly
2. Component list loads with all libraries
3. Drag and drop components onto canvas
4. Wire connections between components
5. Transient Analysis - correct waveform output
6. DC Sweep - correct graph output
7. DC Solver - correct node voltage table
8. AC Analysis - correct graph output
9. SPICE Simulator (direct netlist input) - working
10. Gallery page - loads 6 example circuits with images
11. Gallery circuits open correctly in editor
12. Undo (Ctrl+Z) - working
13. Save dialog appears correctly
14. Admin panel - fully working with all models

### Issues Found ❌

#### Issue 1 - Copy Paste not working
**Feature:** Ctrl+C and Ctrl+V on components
**Expected:** Selected component should be copied and pasted
**Actual:** Nothing happens
**Note:** This was attempted by a 2024 fellow but could not be completed.
  The root cause is that mxGraph XML export strips pin metadata,
  making it impossible to reconnect pasted components to the circuit.

#### Issue 2 - Redo not working
**Feature:** Ctrl+Shift+Z
**Expected:** Redo the last undone action
**Actual:** Nothing happens
**Note:** Undo (Ctrl+Z) works correctly but Redo is broken.

#### Issue 3 - Ctrl+Drag to duplicate not working
**Feature:** Hold Ctrl and drag a component to create a duplicate
**Expected:** A copy of the component should be created
**Actual:** Nothing happens - component just moves

#### Issue 4 - Ctrl+R keyboard shortcut conflict
**Feature:** Ctrl+R should rotate selected component
**Actual:** Browser refresh is triggered instead
**Note:** Rotate works through the toolbar icon but keyboard
  shortcut is intercepted by the browser.

#### Issue 5 - Noise Analysis incorrect output
**Feature:** Noise Analysis simulation
**Expected:** Noise spectrum data for the circuit
**Actual:** Shows ngspice internal constants instead of circuit data:
  V(false), V(true), V(boltz), V(pi), V(kelvin), V(c) etc.
**Impact:** Noise Analysis feature is effectively broken.

---

## 6. Current Tech Stack

| Component      | Version   |
|----------------|-----------|
| Django         | 2.2.12    |
| React          | 16.14.0   |
| Angular        | 7.2.0     |
| PostgreSQL     | 13        |
| ngspice        | 31        |
| Node.js (CI)   | 10.5.0    |
| Celery         | 4.4.2     |
| Python         | 3.7       |

---

## 7. Repository Links

- My Fork: https://github.com/ImranFarhat01/eSim-Cloud
- Upstream (FOSSEE): https://github.com/FOSSEE/eSim-Cloud
- Original: https://github.com/frg-fossee/eSim-Cloud
- Documentation: https://esim-cloud.readthedocs.io
