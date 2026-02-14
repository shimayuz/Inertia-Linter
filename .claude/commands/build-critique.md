# Build & Critique Loop

Run a build-critique iteration cycle on the current implementation.

## Process

### Step 1: Build Verification
Run all verification commands:
```bash
npm run build
npm run test
npx tsc --noEmit
```

If any fail, fix them before proceeding.

### Step 2: Visual Critique (if frontend exists)
Use the Playwright browser to:
1. Navigate to http://localhost:5173
2. Take a screenshot of the current state
3. Evaluate against these criteria:

**Medical UI Checklist:**
- [ ] DEMO MODE badge visible at all times
- [ ] Disclaimer banner present and sticky
- [ ] No occurrence of "clinical inertia" in visible text
- [ ] AI-generated vs Rule-derived labels present
- [ ] Draft watermark on report sections
- [ ] Pillar status colors correct (green/amber/red/gray/purple)
- [ ] GDMT Score displayed prominently

**Design Quality:**
- [ ] 3-pane layout renders correctly (25/45/30 split)
- [ ] Typography hierarchy is clear
- [ ] Interactive elements have hover/focus states
- [ ] Color contrast meets accessibility standards
- [ ] Mobile responsive (check 375px width)

### Step 3: Feedback Report
Generate a structured critique with:
- PASS items (working correctly)
- FAIL items (need fixing, with specific fix suggestions)
- IMPROVE items (optional enhancements)

### Step 4: Iterate
If FAIL items exist, fix them and re-run the loop.
Continue until all items PASS.

$ARGUMENTS
