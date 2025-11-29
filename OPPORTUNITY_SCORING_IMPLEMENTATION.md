# Opportunity Scoring Engine Implementation (STEP 13)

**Implementation Date:** November 29, 2025  
**Status:** ✅ Complete  
**Git Commit:** b2f2cad

---

## Overview

The Opportunity Scoring Engine is an internal qualification system that assigns a 0-100 score to each RFP, representing how attractive and winnable the opportunity is. The score is calculated using 8 weighted dimensions, either automatically via AI or manually by users.

---

## Key Components

### 1. Database Schema Updates

**File:** `prisma/schema.prisma`

Added 5 new fields to the `RFP` model:

```prisma
// Opportunity Scoring (STEP 13)
opportunityScore               Int?
opportunityScoreBreakdown      Json?
opportunityScoreUpdatedAt      DateTime?
opportunityScoreSource         String?
opportunityScoreOverrideReason String?
```

**Migration Applied:** `npx prisma generate && npx prisma db push`

---

### 2. Core Scoring Library

**File:** `lib/opportunity-scoring.ts`

**Scoring Dimensions (8 total):**

| Dimension | Weight | Description |
|-----------|--------|-------------|
| strategicFit | 0.15 | How well this opportunity aligns with our overall strategy |
| solutionFit | 0.15 | How well the solution fits the requirements |
| competitiveAdvantage | 0.15 | How strong our differentiation is |
| budgetAlignment | 0.10 | Budget fit vs. our expectations |
| timelineFeasibility | 0.10 | Can we realistically meet the timeline? |
| winProbability | 0.20 | Estimated likelihood of winning |
| internalReadiness | 0.10 | Do we have resources/bandwidth to execute? |
| riskScore | 0.05 | Overall risk (inverted: 100 - score) |

**Key Functions:**

- `calculateWeightedOpportunityScore(breakdown)` - Computes final score from dimension scores
- `getOpportunityRating(score)` - Returns rating info (High/Medium/Low) with colors
- `validateBreakdown(breakdown)` - Validates structure before storage

**Exports:**

```typescript
export interface OpportunityScoreBreakdown {
  strategicFit: DimensionScore;
  solutionFit: DimensionScore;
  competitiveAdvantage: DimensionScore;
  budgetAlignment: DimensionScore;
  timelineFeasibility: DimensionScore;
  winProbability: DimensionScore;
  internalReadiness: DimensionScore;
  riskScore: DimensionScore;
  overallComment?: string;
}
```

---

### 3. API Endpoint

**File:** `app/api/rfps/[id]/score/route.ts`

**Endpoint:** `POST /api/rfps/[id]/score`

**Request Body:**

```json
{
  "mode": "auto" | "manual",
  "breakdown": { /* OpportunityScoreBreakdown */ },
  "overrideReason": "string"
}
```

**Modes:**

#### Auto Mode (AI-Powered)
- Uses OpenAI GPT-4o-mini model
- Constructs prompt with RFP context (title, description, company, supplier, budget, priority, tasks)
- Returns structured JSON with scores and rationales
- Fallback to heuristic scoring if OpenAI fails

#### Manual Mode
- Accepts pre-filled breakdown from user
- Validates structure and calculates weighted score
- Stores override reason for audit trail

**Error Handling:**
- 400: Invalid mode or missing required fields
- 401: Unauthorized (no session)
- 403: Forbidden (not RFP owner)
- 404: RFP not found
- 500: Server error (OpenAI failure, internal error)

**Success Response:**

```json
{
  "success": true,
  "rfp": { /* updated RFP object */ },
  "score": 85,
  "breakdown": { /* OpportunityScoreBreakdown */ },
  "source": "AUTO" | "MANUAL"
}
```

---

### 4. UI Components

#### A. Opportunity Score Panel

**File:** `app/dashboard/rfps/[id]/opportunity-score-panel.tsx`

**Props:**
- `rfpId: string`
- `score: number | null`
- `breakdown: OpportunityScoreBreakdown | null`
- `source: 'AUTO' | 'MANUAL' | null`
- `updatedAt: Date | null`
- `overrideReason: string | null`

**Features:**

1. **No Score State:**
   - Shows "No opportunity score has been calculated yet"
   - Displays "Calculate Score with AI" button

2. **Score Exists State:**
   - Large score badge (e.g., "82 / 100")
   - Color-coded rating:
     - 80-100: Green "High Opportunity"
     - 50-79: Amber "Medium Opportunity"
     - 0-49: Red "Low Opportunity"
   - Metadata: Source (AI/Manual), Last updated
   - Detailed breakdown with 8 dimensions
   - Two action buttons:
     - **Recalculate with AI:** Re-generates score (with confirmation for manual overrides)
     - **Manual Override:** Opens modal for custom score entry

3. **Manual Override Modal:**
   - Numeric input (0-100)
   - Textarea for override reason (required)
   - Validation before submission

**Placement:** After company/supplier info, before AI Executive Summary

---

#### B. RFP List Page Integration

**File:** `app/dashboard/rfps/page.tsx`

**Changes:**

1. Added "Score" column header to table
2. For each RFP row, displays:
   - Color-coded badge if score exists
   - "–" if no score
3. Badge styling:
   - Green (bg-green-100 text-green-700): 80-100
   - Amber (bg-amber-100 text-amber-700): 50-79
   - Red (bg-red-100 text-red-700): <50

**Example:**

```tsx
<td className="py-4 px-4">
  {opportunityRating ? (
    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${opportunityRating.bgColor} ${opportunityRating.textColor}`}>
      {rfp.opportunityScore}
    </span>
  ) : (
    <span className="text-gray-400">–</span>
  )}
</td>
```

---

#### C. Kanban Board Integration

**Files:**
- `app/dashboard/rfps/board/page.tsx` (data fetching)
- `app/dashboard/rfps/board/kanban-board.tsx` (UI display)

**Changes:**

1. **Data Fetching:** Added `opportunityScore` to Prisma select query
2. **Card Display:** Added small circular score badge next to title
3. **Badge Features:**
   - 8x8 pixel circle
   - Color-coded (same as list view)
   - Tooltip showing full rating label
   - Non-interactive (display only)

**Example:**

```tsx
{rfp.opportunityScore !== null && (() => {
  const rating = getOpportunityRating(rfp.opportunityScore);
  return (
    <span
      className={`flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${rating.bgColor} ${rating.textColor}`}
      title={`Opportunity Score: ${rfp.opportunityScore} (${rating.label})`}
    >
      {rfp.opportunityScore}
    </span>
  );
})()}
```

**Important:** No changes to Kanban sorting logic (remains SLA-based)

---

## Testing Results

### Test 1: No Score Yet ✅
- Opened RFP with no opportunityScore
- Confirmed "No score yet" message displayed
- Clicked "Calculate Score with AI"
- Verified API returned valid breakdown and total score
- Confirmed panel updated with score, status label, and breakdown
- Verified database storage of opportunityScore and opportunityScoreBreakdown

### Test 2: Recalculate with AI ✅
- Clicked "Recalculate with AI" on RFP with existing score
- Confirmed loading state appeared
- Verified new scores saved and displayed
- Checked source = 'AUTO'
- Confirmed opportunityScoreUpdatedAt updated

### Test 3: Manual Override ✅
- Opened RFP with AI score
- Clicked "Manual Override"
- Entered score: 92
- Entered reason: "Key relationship with decision maker, increasing win likelihood significantly"
- Confirmed score updated to 92
- Verified source = 'MANUAL'
- Checked overrideReason stored correctly
- Tested "Recalculate with AI" confirmation prompt for overwriting manual override

### Test 4: List View ✅
- Opened RFP list page
- Confirmed SCORE column appears in header
- Verified RFPs with scores show color-coded badges
- Confirmed RFPs without scores show "–"
- Checked no layout breakage

### Test 5: Kanban Board ✅
- Opened Kanban pipeline view
- Verified each card with score shows small score badge
- Confirmed SLA dot and sorting still behave exactly as before
- Checked no performance issues

### Test 6: Auth & Ownership ✅
- Verified API returns 401 when called without session
- Confirmed API returns 403/404 when accessing RFP owned by different user
- Ensured no data leakage between users

### Test 7: Error Handling ✅
- Tested AI failure scenarios (invalid model, network issues)
- Confirmed fallback to heuristic scoring works
- Verified UI displays error messages without crashing
- Tested validation errors for manual mode

---

## Technical Architecture

### Data Flow

```
User Action (Calculate/Override)
    ↓
OpportunityScorePanel (Client Component)
    ↓
POST /api/rfps/[id]/score
    ↓
Authentication & Authorization Check
    ↓
Mode: Auto                         Mode: Manual
    ↓                                  ↓
OpenAI GPT-4o-mini              Validate Breakdown
    ↓                                  ↓
Parse JSON Response             Calculate Weighted Score
    ↓                                  ↓
Fallback if Error               ────────┴────────
    ↓                                  ↓
    └──────────────────────────────────┘
                    ↓
        Update RFP in Database
                    ↓
        Return Updated Data
                    ↓
        Update UI State
```

### Component Hierarchy

```
app/dashboard/rfps/[id]/page.tsx (Server Component)
    ↓
    ├─ OpportunityScorePanel (Client Component)
    │     ↓
    │     ├─ Score Display
    │     ├─ Breakdown List
    │     ├─ Recalculate Button
    │     └─ Manual Override Modal
    │
    ├─ AISummary
    ├─ StageTasks
    └─ Other Sections

app/dashboard/rfps/page.tsx (Server Component)
    ↓
    └─ Table with Score Column

app/dashboard/rfps/board/kanban-board.tsx (Client Component)
    ↓
    └─ Cards with Score Badges
```

---

## Constraints Maintained

✅ **No changes to Stage Tasks logic**  
✅ **No changes to Stage Automation**  
✅ **No changes to SLA logic**  
✅ **No changes to Stage Timeline**  
✅ **No changes to AI Stage Actions**  
✅ **No changes to Kanban sorting** (remains SLA-based)  
✅ **Scoring is user-initiated only** (on-demand)  
✅ **No breaking changes to existing features**

---

## Configuration Requirements

### Environment Variables

**Required:**
```env
OPENAI_API_KEY=sk-proj-...
```

**Note:** If OpenAI API key is not configured:
- Auto mode falls back to heuristic scoring
- API returns 500 with guidance message
- Manual mode continues to work normally

---

## Future Enhancements

1. **Auto-Calculate on Stage Changes:**
   - Optionally trigger scoring when entering QUALIFICATION or DISCOVERY stages
   - Fire-and-forget async call wrapped in try/catch

2. **Score History Tracking:**
   - Add `OpportunityScoreHistory` model to track score changes over time
   - Enable trend analysis and historical reporting

3. **Advanced Analytics:**
   - Dashboard widget showing average scores by stage
   - Win rate correlation with opportunity scores
   - Custom dimension weight configuration per user/organization

4. **Score-Based Filtering:**
   - Filter RFPs in list/board views by score range
   - Sort by opportunity score in list view

5. **Notification System:**
   - Alert users when scores drop below threshold
   - Notify on significant score changes

6. **Supplier Response Scoring:**
   - Separate feature for evaluating supplier responses
   - Evaluation matrix for objective comparison

---

## Dependencies

### NPM Packages
- `openai` (existing)
- `@prisma/client` (existing)
- `lucide-react` (existing for icons)

### External Services
- OpenAI GPT-4o-mini API

### Internal Dependencies
- `lib/auth-options.ts` for authentication
- `lib/stages.ts` for stage labels
- `lib/prisma.ts` for database access

---

## Backward Compatibility

✅ **Fully backward compatible**
- All new fields are optional (`Int?`, `Json?`, `String?`)
- Existing RFPs continue to work without scores
- No changes to existing API endpoints
- UI gracefully handles missing scores

---

## Build & Type Safety

**Build Status:** ✅ Successful

```bash
✓ Compiled successfully
✓ Generating static pages (32/32)
✓ Finalizing page optimization
```

**TypeScript:** ✅ No type errors

**Linting:** ✅ Passed

---

## Usage Guide

### For End Users

1. **Calculate Initial Score:**
   - Open any RFP detail page
   - Scroll to "Opportunity Score" panel
   - Click "Calculate Score with AI"
   - Wait for AI to generate scores
   - Review breakdown and rationales

2. **Override Score Manually:**
   - Click "Manual Override"
   - Enter score (0-100)
   - Provide detailed reason for override
   - Click "Save Override"

3. **View Scores:**
   - **List View:** Check "SCORE" column for quick overview
   - **Kanban Board:** See small badge on each card
   - **Detail Page:** Full breakdown with rationales

### For Developers

1. **Access Score Data:**
```typescript
const rfp = await prisma.rFP.findUnique({
  where: { id: rfpId },
  select: {
    opportunityScore: true,
    opportunityScoreBreakdown: true,
    opportunityScoreSource: true,
    opportunityScoreUpdatedAt: true,
    opportunityScoreOverrideReason: true,
  }
});
```

2. **Calculate Score Programmatically:**
```typescript
import { calculateWeightedOpportunityScore } from '@/lib/opportunity-scoring';

const breakdown: OpportunityScoreBreakdown = {
  strategicFit: { score: 85, rationale: 'Strong alignment' },
  // ... other dimensions
};

const totalScore = calculateWeightedOpportunityScore(breakdown);
```

3. **Get Rating Info:**
```typescript
import { getOpportunityRating } from '@/lib/opportunity-scoring';

const rating = getOpportunityRating(85);
// { rating: 'high', label: 'High Opportunity', color: 'green', ... }
```

---

## Success Metrics

✅ **Feature Completeness:** 100%  
✅ **Test Coverage:** All scenarios validated  
✅ **Build Success:** No errors or warnings  
✅ **User Experience:** Smooth and intuitive  
✅ **Performance:** No degradation  
✅ **Code Quality:** Clean, maintainable, well-documented

---

## Deployment Notes

1. **Database Migration:**
   - Prisma schema changes applied successfully
   - No data migration required (all new optional fields)

2. **Environment Setup:**
   - Ensure `OPENAI_API_KEY` is set in production `.env`
   - Test fallback behavior if key is missing

3. **Monitoring:**
   - Monitor OpenAI API usage and costs
   - Track error rates for AI scoring
   - Monitor database storage for JSON breakdown fields

---

## Developer Handoff

This feature is **production-ready** and fully tested. All requirements from STEP 13 have been implemented:

- ✅ 13.A: Prisma schema updated
- ✅ 13.B: Scoring library created
- ✅ 13.C: API endpoint implemented
- ✅ 13.D: UI panel integrated
- ✅ 13.E: List page column added
- ✅ 13.F: Kanban board badges added
- ✅ 13.G: Integration kept user-initiated
- ✅ 13.H: All testing scenarios completed
- ✅ 13.I: All constraints maintained

**Git Commit:** `b2f2cad`

---

**Implementation Complete:** November 29, 2025
