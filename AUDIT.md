# eSim Cloud -- Audit Document

**Author:** Imran Farhat (ImranFarhat01)
**Fellowship:** FOSSEE Summer Fellowship 2026
**Task:** Development of eSim on Cloud
**Supervised by:** Sumanto Kar, Shanthi Priya
**Period:** May -- June 2026

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

---

## 6. Bugs Found and Fix Status

### Summary Table

| Bug | Title | Status | PR |
|-----|-------|--------|----|
| Bug 2  | Noise Analysis showing ngspice internal constants | Fixed -- PR submitted | [#18](https://github.com/FOSSEE/eSim-Cloud/pull/18) |
| Bug 3a | Ctrl+S crash: gridRef.current is null | Fixed upstream | -- |
| Bug 3b | Save dialog 500 error from get_lti_id on dict | Fixed -- PR submitted | [#19](https://github.com/FOSSEE/eSim-Cloud/pull/19) |
| Bug 4  | Share URL uses backslashes | Fixed upstream | -- |
| Bug 5  | Shared circuit URL opens blank canvas | Fixed -- PR submitted | [#22](https://github.com/FOSSEE/eSim-Cloud/pull/22) |
| Bug 6  | Email backend hardcoded to console | Fixed by co-intern | -- |
| Bug 7  | Arduino not accessible via /arduino route | Fixed -- PR submitted | [#26](https://github.com/FOSSEE/eSim-Cloud/pull/26) |
| Bug 8  | KiCad 6+ .kicad_sch format not supported | In progress | -- |
| Bug 9  | LAUNCH button opens blank canvas | Fixed -- PR submitted | [#22](https://github.com/FOSSEE/eSim-Cloud/pull/22) |
| Bug 10 | Component value label not updating after edit | Fixed -- PR submitted | [#27](https://github.com/FOSSEE/eSim-Cloud/pull/27) |
| Bug 11 | LTI URL generation fails silently | Fixed -- PR submitted | [#28](https://github.com/FOSSEE/eSim-Cloud/pull/28) |
| Bug 12 | My Profile page is blank | Fixed -- PR submitted | [#34](https://github.com/FOSSEE/eSim-Cloud/pull/34) |
| Bug 13 | Custom library upload shows generic error | Fixed -- PR submitted | [#32](https://github.com/FOSSEE/eSim-Cloud/pull/32) |
| Bug 14 | homeURL uses backslashes, navigation fails | Fixed -- PR submitted | [#23](https://github.com/FOSSEE/eSim-Cloud/pull/23) |
| Bug 15 | Save dialog stuck when save is duplicate | Fixed -- PR submitted | [#24](https://github.com/FOSSEE/eSim-Cloud/pull/24) |
| Bug 16 | Migration files excluded by .gitignore | Fixed -- PR submitted | [#25](https://github.com/FOSSEE/eSim-Cloud/pull/25) |
| Bug 17 | LTI delete/recreate fails with 400 error | Fixed -- PR submitted | [#29](https://github.com/FOSSEE/eSim-Cloud/pull/29) |

---

### Bug Details

---

#### Bug 2 -- Noise Analysis showing ngspice internal constants
**PR:** https://github.com/FOSSEE/eSim-Cloud/pull/18
**Branch:** fix/noise-analysis-clean
**Status:** Open

**Problem:**
Noise Analysis output showed ngspice internal constants like V(false),
V(true), V(boltz), V(pi) etc. mixed into the results. The control block
also used the wrong vector names and wrong plot switching, causing
incorrect/failed output.

**Root Cause:**
ngspice output parser read wrong data from the simulation output file,
picking up internal constants instead of circuit results. The control
block used wrong vector names and wrong plot switching logic.

**Fix:**
- Changed noise control block to use setplot noise1/setplot noise2
  (via the existing noiseMode toggle) then print all
- ngspice 31 outputs noise data correctly when print all is used
  after setplot, going through the graph parser correctly
- Added NGSPICE_INTERNAL_VARS filter in parse.py as an additional
  safeguard against internal variable leakage
- Used noiseMode in the control block so the "Show Noise Spectrum"
  toggle correctly switches between:
  - noise1: inoise_spectrum/onoise_spectrum (frequency-domain)
  - noise2: inoise_total/onoise_total (integrated totals)

**Testing:**
- Ran Noise Analysis with "Show Noise Spectrum" checked: returns
  frequency, inoise_spectrum, onoise_spectrum columns correctly
- Ran with "Show Noise Spectrum" unchecked: returns inoise_total,
  onoise_total correctly in the output table
- No ngspice internal variables appear in either mode
- Simulation completes without "no such plot named noise1" error

---

#### Bug 3a -- Ctrl+S crash: gridRef.current is null
**Status:** Fixed upstream -- no PR submitted

**Problem:**
Ctrl+S triggered "Unhandled Rejection (TypeError): can't access property
scrollWidth, gridRef.current is null"

**Root Cause:**
exportImage accessed gridRef.current before it was initialized during
keyboard shortcut save.

**Note:**
Already fixed on upstream develop via a null guard in
SchematicToolbar.js before this audit began.

---

#### Bug 3b -- Save dialog 500 error from get_lti_id on dict
**PR:** https://github.com/FOSSEE/eSim-Cloud/pull/19
**Branch:** fix/save-dialog-clean
**Status:** Open

**Problem:**
Clicking SAVE in the Save dialog triggered a 500 Internal Server Error
on every attempt.

**Root Cause:**
get_lti_id() in StateSaveSerializer and SaveListSerializer
(saveAPI/serializers.py) accessed obj.save_id, assuming obj is always
a model instance. In some serialization contexts obj can be an
OrderedDict/dict, which has no save_id attribute, causing an
AttributeError and a 500 response.

**Fix:**
Added an isinstance(obj, dict) check at the start of both
get_lti_id() methods to return None early when obj is a dict.

**Testing:**
- Opened the Save dialog, entered a title, clicked SAVE
- Save request now returns 200 with a valid JSON response (lti_id: null)
- Verified no 500 error occurs

**Note:**
A related frontend crash (Ctrl+S before grid initialization) was found
alongside this bug during testing, but it is already fixed on develop
(exportImage null guard in SchematicToolbar.js), so this PR is scoped
to only the backend serializer fix.

---

#### Bug 4 -- Share URL uses backslashes
**Status:** Fixed upstream -- no PR submitted

**Problem:**
Share circuit URL generated as http:\\localhost/eda/#/editor?id=[save_id]
instead of http://localhost/eda/#/editor?id=[save_id]

**Root Cause:**
Template literal used \\\\ instead of // as protocol separator in
Header.js line 422.

**Note:**
Already fixed on upstream develop before this audit began.

---

#### Bug 5 -- Shared circuit URL opens blank canvas
**PR:** https://github.com/FOSSEE/eSim-Cloud/pull/22
**Branch:** fix/fetch-schematic-clean
**Status:** Open (combined with Bug 9)

**Problem:**
Opening a shared circuit URL with no branch query parameter resulted
in a blank canvas instead of the shared circuit.

**Root Cause:**
fetchSchematic builds the API request as save/{id}/{version}/{branch}.
When the share URL contained no branch param, version and branch were
undefined, producing a request like save/{id}/undefined/undefined,
which failed silently.

**Fix:**
Default branch to 'master' when the branch query param is absent
from the URL.

**Testing:**
Opened a shared circuit URL with no branch param: circuit loads
correctly instead of showing a blank canvas.

---

#### Bug 6 -- Email backend hardcoded to console
**Status:** Fixed by co-intern -- no PR submitted

**Problem:**
Verification emails were printed to Django console logs instead of
being sent to the user's inbox.

**Root Cause:**
settings.py hardcoded the console email backend. Correct SMTP
configuration existed in lines 132-137 but was entirely commented out.

---

#### Bug 7 -- Arduino not accessible via Nginx route
**PR:** https://github.com/FOSSEE/eSim-Cloud/pull/26
**Branch:** fix/arduino-nginx-route-clean
**Status:** Open

**Problem:**
Arduino on Cloud was not accessible via http://localhost/arduino.
The page kept loading indefinitely.

**Root Cause:**
- Angular dev server served everything at root / instead of /arduino/,
  so nginx's location /arduino/ proxy_pass had nothing matching to serve
- nginx's /arduino/ location lacked WebSocket upgrade headers needed
  for Angular's live-reload dev server over the proxy

**Fix:**
- arduino-frontend's start command now includes
  --base-href /arduino/ --serve-path /arduino/, so Angular correctly
  serves under that path
- Added proxy_http_version 1.1 and Upgrade/Connection headers to the
  /arduino/ nginx location block

**Testing:**
- http://localhost/arduino loads the Arduino on Cloud editor correctly
- http://localhost/eda still loads the eSim editor correctly with no
  regression (eda-frontend's command was left untouched since it is a
  React app and the base-href flag only applies to Angular)

---

#### Bug 8 -- KiCad 6+ .kicad_sch format not supported
**Branch:** fix/kicad-new-format (in progress)
**Status:** In progress -- no PR submitted

**Problem:**
Only the old .sch format (KiCad 5 and below) was supported. The new
.kicad_sch S-expression format used in KiCad 6+ failed to import.

**Root Cause:**
Parser in KiCadFileUtils.js only handled the old legacy format.
The importer was implemented in 2021 and never updated for KiCad 6+.

**Work Completed:**
- Frontend: generic S-expr parser, parseLibSymbols(), rotatePoint(),
  readKicadSchNew(), KICAD_TO_ESIM_MAP, joinComponentsNew() with
  union-find net grouping in KiCadFileUtils.js
- Backend: parse_kicad_sym_file(), get_symbol_origin_in_svg(),
  inject_metadata_into_svg() in kicad_sym_utils.py
- Handoff document prepared for co-intern to continue cloud-side work

---

#### Bug 9 -- LAUNCH button opens blank canvas
**PR:** https://github.com/FOSSEE/eSim-Cloud/pull/22
**Branch:** fix/fetch-schematic-clean
**Status:** Open (combined with Bug 5)

**Problem:**
Clicking LAUNCH on a saved circuit in the schematics list loaded a
blank canvas instead of the circuit.

**Root Cause:**
LAUNCH button called fetchSchematic(sch.save_id) but fetchSchematic
requires 3 arguments: saveId, version, branch. Version and branch were
undefined, causing the API call to fail silently.

**Fix:**
LAUNCH button now passes sch.version and sch.branch (both already
present in the SaveListSerializer API response) to fetchSchematic.

**Testing:**
Saved a circuit, clicked LAUNCH from the schematics list: circuit
loads correctly on canvas.

---

#### Bug 10 -- Component value label not updating after edit
**PR:** https://github.com/FOSSEE/eSim-Cloud/pull/27
**Branch:** fix/component-label-update-clean
**Status:** Open

**Problem:**
Component value label on the canvas did not update after using
SET PARAMETERS in the Component Properties panel. Old value was
displayed until the circuit was reopened.

**Root Cause:**
The Redux state was updated correctly, but nothing told mxGraph to
refresh the displayed cell label. The canvas label-building logic
only existed inside the netlist generation function and was never
wired up to the Properties panel.

**Fix:**
- Extracted the label-building rules into a single shared function,
  buildComponentCanvasLabel(baseName, properties)
- Netlist generation now calls this function once instead of repeating
  the same label-building logic across 7 different branches
- The Properties panel now looks up the edited cell directly via the
  graph model, preserves the component's base name, rebuilds the value
  portion using the shared function, and applies it immediately to
  the canvas

**Testing:**
- Resistor: edited value, canvas immediately shows component name and
  new value together, name preserved
- Capacitor: same, name preserved
- Voltage source with a custom waveform expression: edited value,
  canvas immediately shows the name and new expression together
- Generated a netlist after edits to confirm simulation output is
  unaffected by the refactor

---

#### Bug 11 -- LTI URL generation fails silently with empty fields
**PR:** https://github.com/FOSSEE/eSim-Cloud/pull/28
**Branch:** fix/lti-validation-clean
**Status:** Open

**Problem:**
Clicking the LTI URL generation button with empty fields did nothing
visible to the user.

**Root Cause:**
The handler accessed the selected schematic's id even when no schematic
was selected, causing a silent failure. An unhandled error appeared only
in the browser console with no feedback shown on screen.

**Fix:**
- Added a check for a missing consumer key or secret key
- Added a check for a missing or incomplete schematic selection
- Both checks show a clear error message using the existing error
  display already present in the component

**Testing:**
- Clicking generate with all fields empty shows:
  "Consumer Key and Secret Key are required."
- Filling in keys but leaving schematic unselected shows:
  "Please select a schematic before generating LTI URL."
- Filling in all fields correctly still generates the LTI URL as expected

---

#### Bug 12 -- My Profile page is blank
**PR:** https://github.com/FOSSEE/eSim-Cloud/pull/34
**Branch:** fix/profile-page-clean
**Status:** Open

**Problem:**
/dashboard/profile route existed in the router but had no component
assigned, rendering a completely blank white page. Additionally,
last_login was never updated on login because the custom token auth
view did not call Django's login(), so it always showed null.

**Root Cause:**
Route defined as <Route exact path="/dashboard/profile" /> with no
component prop assigned.

**Fix:**
- Created UserProfile React component with avatar, schematic/simulation
  stats, view mode, edit mode, and change password dialog
- Added UserProfileSerializer exposing id, username, email, first_name,
  last_name, date_joined, last_login
- Added UserProfileUpdateSerializer for PATCH requests (editable fields only)
- Added UserProfileView REST endpoint at /api/auth/user/profile/
- Wired /dashboard/profile route to UserProfile component
- Added autoComplete="new-password" to password fields to prevent
  browser autofill
- Merged PATCH response into existing profile state to preserve
  read-only fields like date_joined after editing
- Updated last_login on token auth to reflect actual login time

**Testing:**
- Profile page loads with correct user data (username, email,
  member since, last login, schematic count)
- Edit profile updates fields and shows success toast; date_joined
  is preserved after save
- Change password dialog opens with empty fields (no autofill)
- Last login updates correctly after each login

---

#### Bug 13 -- Custom library upload shows generic error
**PR:** https://github.com/FOSSEE/eSim-Cloud/pull/32
**Branch:** fix/library-upload-error-clean
**Status:** Open

**Problem:**
- Any upload failure showed a generic "An Error Occured" message with
  no actionable information
- The uploadSuccess reducer discarded the HTTP status code, storing
  only true/false
- Re-uploading a library crashed with KeyError because save_libs
  globbed all SVGs in the output folder (including leftovers from
  previous uploads), then failed to find them in the current upload's
  component_details dict

**Root Cause:**
uploadSuccess reducer only checked for HTTP 201. Any non-201 response
produced the same generic error regardless of the actual reason.
Additionally, a pre-existing KeyError crash in lib_utils.py save_libs
caused by stale SVG globs from previous uploads.

**Fix:**
- Reducer stores HTTP status code in uploadError field on failure
- Component reads uploadError via useSelector
- Specific messages shown for 400, 401, 403, 413, 500 status codes
- Added uploadError to useEffect dependency array to satisfy eslint
- Skip SVGs not present in component_details instead of raising KeyError

**Testing:**
- Uploaded valid .lib + .dcm files as a non-admin user: "Upload
  Successful" shown, component renders correctly on canvas
- Uploaded invalid file: "Upload Failed: Invalid file format. Please
  upload valid .lib and .dcm files." shown
- Re-upload of same library now succeeds instead of crashing

---

#### Bug 14 -- homeURL construction uses backslashes, navigation fails
**PR:** https://github.com/FOSSEE/eSim-Cloud/pull/23
**Branch:** fix/home-url-backslash
**Status:** Open

**Problem:**
Save-and-navigate dialogs shown when leaving the editor via Dashboard,
Gallery, or Simulator nav links failed to navigate after a successful
save, leaving the dialog appearing stuck.

**Root Cause:**
homeURL was constructed as:
  ${window.location.protocol}\\${window.location.host}/...
Browsers do not treat backslashes as a protocol separator.
window.open()/window.location navigation with this malformed URL
failed silently, producing a broken nested path like
http://localhost/localhost/eda/... instead of the intended destination.

**Fix:**
Replaced \\ with // in all 4 occurrences (HomeDialog and
SchematicNameDialog components, both the 'home' and routeVal branches).

**Testing:**
- Confirmed homeURL now logs correctly as
  http://localhost/eda/#/dashboard instead of
  http:\\localhost/eda/#/dashboard
- Verified via window.open() in browser console that the malformed URL
  produces a broken nested path while the fixed URL navigates correctly

**Note:**
Same class of bug as Bug 4 (share URL backslashes), but in a different
file and location that was missed by the upstream fix.

---

#### Bug 15 -- Save dialog stuck when save is a duplicate
**PR:** https://github.com/FOSSEE/eSim-Cloud/pull/24
**Branch:** fix/duplicate-save-navigation
**Status:** Open

**Problem:**
Save-and-navigate dialogs stayed open indefinitely if the saved content
was unchanged since the last save, with no feedback to the user.

**Root Cause:**
The backend returns duplicate: true when the posted content matches an
existing save with the same branch. The frontend success handler only
called the navigation callback when the response was not a duplicate:
  if (!res.data.duplicate) { setVersions(res.data.version, false, null) }
This skipped navigation entirely for duplicate saves, leaving the user
stuck with no indication that the save had already succeeded.

**Fix:**
Always call setVersions regardless of duplicate status, so navigation
proceeds whether or not a new version was created.

**Testing:**
- Saved a circuit, made no changes, triggered the Dashboard
  save-and-navigate dialog again: backend returned duplicate: true,
  and the dialog now navigates to the dashboard as expected
- Confirmed regular (non-duplicate) saves still navigate correctly

---

#### Bug 16 -- Migration files excluded by .gitignore
**PR:** https://github.com/FOSSEE/eSim-Cloud/pull/25
**Branch:** fix/missing-pinned-migration
**Status:** Open

**Problem:**
Dashboard showed a 500 error on a fresh database setup when loading
saved circuits.

**Root Cause:**
.gitignore had a bare migrations entry that excluded all Django
migration files repo-wide. Migration files only ever existed on
individual developers' machines, never in the actual repo. A fresh
clone and migrate produced a database missing columns the code
expected, including StateSave.pinned.

**Fix:**
- Removed the migrations rule from .gitignore
- Added the current migration files for every app to the repo

**Testing:**
Wiped database, rebuilt containers from scratch, ran migrate using
only what is in this PR, loaded fixtures, opened Dashboard. No error,
loads correctly.

---

#### Bug 17 -- LTI delete/recreate fails with 400 error
**PR:** https://github.com/FOSSEE/eSim-Cloud/pull/29
**Branch:** fix/lti-scored-field-reset
**Status:** Open

**Problem:**
After deleting an LTI app, creating a new one for the same circuit
failed with a 400 error ("scored: This field is required"), with no
feedback shown to the user beyond a generic console error.

**Root Cause:**
handleDeleteLTIApp rebuilt the ltiDetails state from scratch after a
successful delete, but the rebuilt object did not match the shape of
a genuinely fresh working state in two ways:
- It omitted the scored boolean field entirely, which then got
  silently dropped from the request body
- It set the score field to an empty string, which the backend rejects
  as "not a valid number" (it allows null, but not an empty string)

**Fix:**
- Restored the missing boolean field to match the component's actual
  initial default
- Changed the score field from an empty string to null, matching what
  the backend explicitly allows

**Testing:**
Created an LTI app, deleted it, created a new one for the same circuit
without touching any optional fields: succeeds where it previously failed.

---

## 7. Improvements Identified

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

## 8. Current Tech Stack

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

## 9. Repository Links

- My Fork: https://github.com/ImranFarhat01/eSim-Cloud
- Upstream (FOSSEE): https://github.com/FOSSEE/eSim-Cloud
- Original: https://github.com/frg-fossee/eSim-Cloud
- Documentation: https://esim-cloud.readthedocs.io

