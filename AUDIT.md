# eSim Cloud -- Audit Document
**Author:** Imran Farhat (ImranFarhat01)
**Date:** 20-27 May 2026
**Task:** Development of eSim on Cloud -- FOSSEE Summer Fellowship 2026

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

### Issue 1 -- PostgreSQL Version Incompatibility
**Error:** esim-cloud_db_1 container exited with error code 1.
**Error Message:**
  "Error: in 18+, these Docker images are configured to store database
  data in a format which is compatible with pg_ctlcluster"
**Root Cause:** docker-compose.dev.yml used image: postgres (latest = v18)
  which is incompatible with the project data format.
**Fix:**
- Changed docker-compose.dev.yml: image: postgres to image: postgres:13
- Deleted old postgres_data folder: sudo rm -rf postgres_data
- Restarted all containers
**Result:** PostgreSQL 13 started successfully.

---

## 4. Current System State

### All 7 containers running successfully:
- esim-cloud_nginx_1          -- Up (port 80)
- esim-cloud_eda-frontend      -- Up (port 3000) -- React eSim editor
- esim-cloud_arduino-frontend  -- Up (port 4200) -- Angular Arduino
- esim-cloud_django_1          -- Up (port 8000) -- Backend API
- esim-cloud_celery_1          -- Up -- Async simulation worker
- esim-cloud_db_1              -- Up (port 5432) -- PostgreSQL 13
- esim-cloud_redis_1           -- Up (port 6379) -- Job queue

---

## 5. Features Tested

### Working Features
1. eSim editor loads correctly
2. Component list loads with all libraries (1099 components across 15 libraries)
3. Drag and drop components onto canvas
4. Wire connections between components
5. T-junction wire connections
6. Move wire after drawing
7. Delete wire breaks connection correctly
8. Transient Analysis -- correct waveform output
9. DC Sweep -- correct graph output
10. DC Solver -- correct node voltage table
11. AC Analysis -- correct graph output
12. SPICE Simulator (direct netlist input) -- working
13. Gallery page -- loads 6 example circuits with images
14. Gallery circuits open correctly in editor
15. Undo (Ctrl+Z) -- working
16. Redo (Ctrl+Shift+Z) -- working
17. Default Size (Ctrl+Y) -- working
18. Rotate clockwise (Alt + Right Arrow) -- working
19. Rotate counter-clockwise (Alt + Left Arrow) -- working
20. Save via toolbar icon -- working
21. Print (Ctrl+P) -- working
22. Open Dialog (Ctrl+O) -- working
23. Export as JSON (Ctrl+E) -- working
24. Export as Image (Ctrl+Shift+E) -- working
25. Clear All (Shift+Del) -- working
26. Delete component (Del) -- working
27. Admin panel -- fully working with all models
28. Dashboard -- saved circuits appear with thumbnails
29. Circuit reopens correctly from Dashboard
30. Version History -- save, restore, multiple versions working
31. Schematic Description -- saves and persists correctly
32. Component search by KEYWORD, PREFIX, NAME -- working
33. Component properties editing -- working
34. Library Manager -- add/remove libraries dynamically working
35. Favourite Components -- add, display, remove, persist after refresh
36. Arduino editor loads correctly at localhost:4200
37. Arduino drag and drop components -- working
38. Arduino wire connections -- working
39. Arduino code compilation -- working
40. Arduino code editing -- working
41. Arduino Gallery -- loads with example circuits
42. Arduino Gallery circuits open and simulate correctly
43. Arduino LED animation -- working correctly when properly wired
44. User registration form -- working
45. Password strength validation -- working
46. Account activation via email link -- working
47. Export as PNG, JPG, SVG -- working
48. Print Preview -- working
49. Netlist Generator -- correct SPICE netlist output
50. ERC Check -- working
51. Local file upload (JSON import) -- working
52. Projects page -- loads correctly
53. My Schematics page -- working with search
54. Delete circuit from dashboard -- working
55. Download Graph Output as CSV -- working
56. Zoom In (Ctrl++) -- working
57. Zoom Out (Ctrl+-) -- working
58. Help section -- keyboard shortcuts and simulation modes documented
59. Runtime stats in admin -- working with graph
60. Simulations log in admin -- all simulations recorded
61. State saves in admin -- all circuits saved with thumbnails
62. Gallery admin -- 35 circuits (25 Arduino, 10 eSim)

### Bugs Found

#### Bug 1 -- Copy Paste not working
**Feature:** Ctrl+C and Ctrl+V on components
**Expected:** Selected component should be copied and pasted
**Actual:** Nothing happens
**File:** eda-frontend/src/components/SchematicEditor/
**Root Cause:** No copy/paste implementation exists in the codebase.
  Attempted by 2024 fellow but not completed. mxGraph XML export
  strips pin metadata making it impossible to reconnect pasted
  components to the circuit.

#### Bug 2 -- Noise Analysis and Transfer Function show wrong output
**Feature:** Noise Analysis and Transfer Function Analysis simulations
**Expected:** Actual circuit simulation results
**Actual:** Shows ngspice internal mathematical constants instead:
  V(false), V(true), V(boltz), V(c), V(pi), V(kelvin), V(e) etc.
**Root Cause:** ngspice output parser reads wrong data from simulation
  output file -- picks up internal constants instead of circuit results.
**Impact:** Both Noise Analysis and Transfer Function Analysis are
  effectively not usable.

#### Bug 3 -- Save has multiple issues
**Feature:** Save schematic
**Issue 3a:** Ctrl+S triggers error:
  "Unhandled Rejection (TypeError): can't access property
  scrollWidth, gridRef.current is null"
  File: src/components/SchematicEditor/SchematicToolbar.js line 434
  Root Cause: exportImage function accesses gridRef.current before
  it is initialized during keyboard shortcut save.
**Issue 3b:** Save dialog final SAVE button does nothing when clicked
  Root Cause: Backend throws 500 error on every save attempt:
  "Internal Server Error: /api/save --
  AttributeError: 'collections.OrderedDict' object has no attribute
  'save_id'"
  This error is logged repeatedly in Django container logs.
**Note:** Only toolbar Save icon works correctly without errors.

#### Bug 4 -- Share URL uses wrong format
**Feature:** Share circuit via URL
**Expected:** http://localhost/eda/#/editor?id=[save_id]
**Actual:** http:\\localhost/eda/#/editor?id=[save_id]
**File:** eda-frontend/src/components/SchematicEditor/Header.js line 422
**Root Cause:** Code uses window.location.protocol with \\\\ separator:
  value={`${window.location.protocol}\\\\${window.location.host}/eda/...`}
  window.location.protocol returns "http:" and \\\\ adds backslashes.
**Fix:** Replace \\\\ with // in the URL template literal.

#### Bug 5 -- Shared circuit URL opens blank canvas
**Feature:** Open shared circuit via URL
**Expected:** Shared circuit loads in editor
**Actual:** Blank empty canvas opens instead of the shared circuit
**File:** eda-frontend/src/redux/actions/saveSchematicActions.js line 201
**Root Cause:** fetchSchematic requires 3 arguments (saveId, version,
  branch) but share URL only contains save_id. The API call:
  api.get('save/' + saveId + '/' + version + '/' + branch)
  fails silently because version and branch are undefined.

#### Bug 6 -- Email backend hardcoded to console in settings.py
**Feature:** New user registration verification email
**Expected:** Verification email sent to user inbox via SMTP
**Actual:** Email printed to Django console logs instead of sent
**File:** esim-cloud-backend/esimCloud/settings.py line 129
**Root Cause:** Line 129 hardcodes console email backend:
  EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
  Correct SMTP configuration exists in lines 132-137 but is entirely
  commented out.
**Fix:** Uncomment lines 132-137 and comment out line 129. Then
  configure proper SMTP credentials in .env file.

#### Bug 7 -- Arduino not accessible via Nginx route
**Feature:** Access Arduino on Cloud via http://localhost/arduino
**Expected:** Arduino editor opens
**Actual:** Page keeps loading indefinitely
**File:** Nginx/dev.conf.d/local.conf
**Root Cause:** Nginx config has location /arduino/ with trailing slash:
  location /arduino/ { proxy_pass http://arduino_frontend; }
  Browser requests /arduino without trailing slash. Nginx does not
  redirect automatically causing the request to never match the route.
**Note:** Arduino works correctly at http://localhost:4200

#### Bug 8 -- KiCad new format not supported
**Feature:** Import KiCad schematic files
**Expected:** Both .sch and .kicad_sch formats supported
**Actual:** Only old .sch format (KiCad 5 and below) works
**File:** eda-frontend/src/components/SchematicEditor/Helper/KiCadFileUtils.js
**Root Cause:** Parser only handles old .sch legacy format:
  const readKicadSchematic = (text) => { ... }
  No support for new .kicad_sch S-expression format used in KiCad 6+.
  Importer was implemented in 2021 and never updated.

#### Bug 9 -- On Cloud open dialog LAUNCH button not working
**Feature:** Open saved circuit from On Cloud dialog
**Expected:** Clicking LAUNCH opens the selected circuit in editor
**Actual:** Nothing happens when LAUNCH button is clicked
**File:** eda-frontend/src/components/SchematicEditor/ToolbarExtension.js line 840
**Root Cause:** LAUNCH button calls:
  dispatch(fetchSchematic(sch.save_id))
  But fetchSchematic requires 3 arguments: saveId, version, branch.
  version and branch are undefined causing the API call to fail silently.

#### Bug 10 -- Component value on canvas does not update after editing
**Feature:** Component value label on schematic canvas
**Expected:** Canvas label updates immediately after SET PARAMETERS
**Actual:** Canvas label shows old value until circuit is reopened
**File:** eda-frontend/src/redux/reducers/componentPropertiesReducer.js
**Root Cause:** SET_COMP_PROPERTIES reducer only updates Redux state.
  No mxGraph setValue() or refresh() call is made to update the
  actual canvas label. Canvas and Redux state are completely
  disconnected for component value updates.

#### Bug 11 -- LTI URL creation does nothing when fields empty
**Feature:** Create LTI URL for classroom integration
**Expected:** Validation error shown when required fields are empty
**Actual:** Clicking CREATE LTI URL with empty fields does nothing
**File:** eda-frontend/src/components/LTI/LTI.js
**Root Cause:** handleLTIGenerate sends API request with
  model_schematic: ltiDetails.modelSchematic.id which is undefined
  when no schematic is selected. Request fails silently with no
  user feedback.

#### Bug 12 -- My Profile page is blank
**Feature:** User profile page
**Expected:** User profile information and edit form
**Actual:** Completely blank white page
**File:** eda-frontend/src/pages/Dashboard.js line 63
**Root Cause:** Route is defined with no component:
  <Route exact path="/dashboard/profile" />
  No component is assigned to this route so it renders nothing.

#### Bug 13 -- Custom library upload shows generic error
**Feature:** Upload custom .lib and .dcm files
**Expected:** Library uploads successfully or shows specific error
**Actual:** Shows only "An Error Occured" with no details
**File:** eda-frontend/src/components/SchematicEditor/ToolbarExtension.js line 1036
**Root Cause:** uploadSuccess reducer only checks for HTTP 201:
  if (action.payload === 201) { uploadSuccess: true }
  else { uploadSuccess: false }
  Any non-201 response shows the same generic error regardless of
  actual error reason (auth failure, wrong format, server error etc.)

#### Bug 14 -- Home/Dashboard/Gallery/Simulator save dialog uses wrong URL format
**Feature:** Save-and-navigate dialog shown when leaving editor via Dashboard, Gallery, or Simulator nav links
**Expected:** After saving, browser navigates to the selected destination
**Actual:** Navigation silently fails, URL resolves to a broken nested path
**File:** eda-frontend/src/components/SchematicEditor/ToolbarExtension.js lines 500, 502, 587, 589
**Root Cause:** homeURL built as:
  `${window.location.protocol}\\\\${window.location.host}/...`
  Browsers do not treat backslashes as a protocol separator, so
  window.open()/window.location navigation with this string fails
  silently instead of navigating to the intended page.

#### Bug 15 -- Save dialog does not navigate away when save is a duplicate
**Feature:** Save-and-navigate dialog shown when leaving editor via Dashboard, Gallery, or Simulator nav links
**Expected:** After a successful save, dialog closes and navigates to destination
**Actual:** If saved content is unchanged since the last save (backend returns duplicate: true), dialog stays open indefinitely with no feedback
**File:** eda-frontend/src/redux/actions/saveSchematicActions.js line 79
**Root Cause:** Success handler only calls the navigation callback when
  the response is not a duplicate:
  if (!res.data.duplicate) { setVersions(res.data.version, false, null) }
  This was likely intended to skip creating a redundant version record,
  but it also skips navigation entirely, leaving the user stuck with no
  indication that the save already succeeded.

#### Bug 16 -- Missing migration for StateSave.pinned field
**Feature:** Dashboard schematics list (/api/save, /api/save/list)
**Expected:** Dashboard loads saved circuits list
**Actual:** 500 Internal Server Error on a fresh database/migration run
**File:** esim-cloud-backend/saveAPI/models.py, esim-cloud-backend/saveAPI/migrations/
**Root Cause:** pinned field was added to the StateSave model
  (pinned = models.BooleanField(default=False, null=False))
  but no corresponding migration file was generated/committed.
  Any fresh `migrate` run leaves the database column missing, causing
  psycopg2.errors.UndefinedColumn on every query touching StateSave.

---

### Improvements Identified

#### Improvement 1 -- Scroll wheel zoom
**Feature:** Zoom in schematic editor
**Current:** Zoom only works via toolbar buttons and Ctrl++ / Ctrl+-
**Suggested:** Add mouse scroll wheel zoom support
**Reason:** Improves usability, standard in all EDA tools like KiCad
  and Altium.

#### Improvement 2 -- Ctrl+Drag to duplicate component
**Feature:** Duplicate component quickly
**Current:** No keyboard shortcut to duplicate a component
**Suggested:** Hold Ctrl and drag component to create a copy
**Reason:** Standard feature in most diagram and EDA editors.

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
