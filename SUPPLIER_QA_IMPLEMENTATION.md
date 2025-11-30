# Supplier Q&A Dialogue System Implementation (STEP 21)

**Implementation Date:** November 30, 2025  
**Status:** ✅ Complete  
**Git Commit:** [To be added after commit]

---

## Overview

The Supplier Q&A Dialogue System enables suppliers to ask questions about RFPs during designated time windows, with buyers able to answer and optionally broadcast responses to all suppliers. This maintains fairness by preventing information leakage between competing suppliers while allowing buyers to share important clarifications globally.

---

## Key Features

### 1. Timeline-Enforced Question Windows
- Questions can only be submitted during the configured `askQuestionsStart` to `askQuestionsEnd` window
- Real-time status indicators (Not Open / Open / Closed)
- Clear messaging about window availability
- Buyers can answer questions at any time (no time restrictions)

### 2. Supplier Question Submission
- 500-character limit with real-time counter
- Questions are private to the asking supplier
- Status tracking (PENDING / ANSWERED)
- Timestamp tracking for ask and answer times

### 3. Buyer Answer Management
- View all questions from all suppliers (with supplier identity visible to buyer)
- Filter by status (All / Pending / Answered)
- Answer with optional broadcast to all suppliers
- Broadcast messages contain NO supplier identity

### 4. Broadcast System
- Answers can be broadcast to all invited suppliers
- Manual broadcast creation for general announcements
- All broadcasts visible to all suppliers equally
- No supplier identity revealed in broadcasts

### 5. Information Security
- Suppliers never see other suppliers' questions
- Suppliers never see other suppliers' identities
- Broadcast messages are anonymous (no supplier attribution)
- Strict role-based access control

### 6. Comparison Integration
- Q&A context included in AI-generated comparison narratives
- Broadcast messages provide context without impacting scores
- Optional section in narrative (null if no broadcasts)

---

## Database Schema Changes

### New Enum: QuestionStatus
```prisma
enum QuestionStatus {
  PENDING
  ANSWERED
}
```

### New Model: SupplierQuestion
```prisma
model SupplierQuestion {
  id                String         @id @default(cuid())
  rfpId             String
  supplierContactId String
  question          String
  answer            String?
  status            QuestionStatus @default(PENDING)
  askedAt           DateTime       @default(now())
  answeredAt        DateTime?
  
  rfp               RFP            @relation(fields: [rfpId], references: [id], onDelete: Cascade)
  supplierContact   SupplierContact @relation(fields: [supplierContactId], references: [id], onDelete: Cascade)
  
  @@index([rfpId])
  @@index([supplierContactId])
}
```

### New Model: SupplierBroadcastMessage
```prisma
model SupplierBroadcastMessage {
  id                  String   @id @default(cuid())
  rfpId               String
  message             String   @db.Text
  createdAt           DateTime @default(now())
  createdBy           String
  supplierVisibility  Json?
  
  rfp                 RFP      @relation(fields: [rfpId], references: [id], onDelete: Cascade)
  
  @@index([rfpId])
}
```

### Updated Relations
- **RFP**: Added `supplierQuestions` and `supplierBroadcastMessages` relations
- **SupplierContact**: Added `supplierQuestions` relation

**Migration Applied:**
```bash
npx prisma generate
npx prisma db push
```

---

## Core Utilities

### lib/qa-timeline.ts
Timeline enforcement utilities for question windows.

**Key Functions:**
- `isQuestionWindowOpen(rfp)`: Boolean check if window is currently open
- `getQuestionWindowStatus(rfp)`: Returns 'NOT_OPEN' | 'OPEN' | 'CLOSED'
- `getQuestionWindowMessage(rfp)`: User-friendly status message
- `getDaysRemainingInQuestionWindow(rfp)`: Days until/since window end
- `getQuestionWindowStyles(status)`: Tailwind CSS classes for status badges

**Dependencies:** `@prisma/client` (RFP type)

---

## API Endpoints

### Supplier APIs

#### POST /api/supplier/rfps/[rfpId]/questions
Submit a new question (within questions window).

**Authentication:** Supplier role required  
**Authorization:** Must be invited to RFP via SupplierContact

**Request Body:**
```json
{
  "question": "string (max 500 chars)"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "question": {
    "id": "clx...",
    "question": "...",
    "status": "PENDING",
    "askedAt": "2025-11-30T12:00:00Z",
    "answer": null,
    "answeredAt": null
  }
}
```

**Error Responses:**
- 400: Window not open, validation errors
- 401: Unauthorized
- 403: Not invited to RFP

---

#### GET /api/supplier/rfps/[rfpId]/questions
Fetch supplier's own questions for an RFP.

**Authentication:** Supplier role required  
**Authorization:** Must be invited to RFP

**Success Response (200):**
```json
{
  "questions": [
    {
      "id": "clx...",
      "question": "...",
      "answer": "..." | null,
      "status": "PENDING" | "ANSWERED",
      "askedAt": "2025-11-30T12:00:00Z",
      "answeredAt": "2025-11-30T15:00:00Z" | null
    }
  ]
}
```

---

#### GET /api/supplier/rfps/[rfpId]/broadcasts
Fetch all broadcast messages for an RFP.

**Authentication:** Supplier role required  
**Authorization:** Must be invited to RFP

**Success Response (200):**
```json
{
  "broadcasts": [
    {
      "id": "clx...",
      "message": "...",
      "createdAt": "2025-11-30T14:00:00Z"
    }
  ]
}
```

**Note:** NO supplier identity or source information included.

---

#### GET /api/supplier/rfps/[rfpId]/timeline
Fetch RFP timeline data for question window enforcement.

**Authentication:** Supplier role required  
**Authorization:** Must be invited to RFP

**Success Response (200):**
```json
{
  "askQuestionsStart": "2025-11-25T00:00:00Z",
  "askQuestionsEnd": "2025-11-30T23:59:59Z"
}
```

---

### Buyer APIs

#### GET /api/dashboard/rfps/[rfpId]/questions
Fetch all questions for an RFP (buyer view with supplier info).

**Authentication:** Buyer role required  
**Authorization:** Must own RFP

**Success Response (200):**
```json
{
  "questions": [
    {
      "id": "clx...",
      "question": "...",
      "answer": "..." | null,
      "status": "PENDING" | "ANSWERED",
      "askedAt": "2025-11-30T12:00:00Z",
      "answeredAt": "2025-11-30T15:00:00Z" | null,
      "supplierContact": {
        "id": "clx...",
        "name": "John Doe",
        "email": "john@supplier.com",
        "organization": "Supplier Corp"
      }
    }
  ]
}
```

---

#### POST /api/dashboard/rfps/[rfpId]/questions
Answer a question with optional broadcast.

**Authentication:** Buyer role required  
**Authorization:** Must own RFP

**Request Body:**
```json
{
  "questionId": "clx...",
  "answer": "string",
  "broadcast": true | false
}
```

**Success Response (200):**
```json
{
  "success": true,
  "question": {
    "id": "clx...",
    "status": "ANSWERED",
    "answer": "...",
    "answeredAt": "2025-11-30T15:00:00Z"
  },
  "broadcast": {
    "id": "clx...",
    "message": "...",
    "createdAt": "2025-11-30T15:00:00Z"
  } | null
}
```

**Behavior:**
- Updates question status to ANSWERED
- Sets `answer` and `answeredAt` fields
- If `broadcast: true`, creates SupplierBroadcastMessage (NO supplier identity)
- If `broadcast: false`, answer visible only to asking supplier

---

#### POST /api/dashboard/rfps/[rfpId]/broadcasts
Create a manual broadcast message.

**Authentication:** Buyer role required  
**Authorization:** Must own RFP

**Request Body:**
```json
{
  "message": "string"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "broadcast": {
    "id": "clx...",
    "message": "...",
    "createdAt": "2025-11-30T15:00:00Z",
    "createdBy": "user_id"
  }
}
```

---

## UI Components

### Supplier Portal

#### /supplier/rfps/[id]/questions (page.tsx)
Main Q&A page for suppliers.

**Features:**
- Question window status banner (color-coded: green/yellow/red)
- Question submission form (if window open)
  - Textarea with 500-char limit
  - Real-time character counter
  - Submit button (disabled if window closed or invalid)
- List of supplier's own questions
  - Status badges (Pending / Answered)
  - Question text and timestamps
  - Answer text (if answered)
  - Reverse-chronological order

**State Management:**
- Fetches questions and timeline on mount
- Auto-refreshes after successful submission
- Success/error toast notifications

**Security:**
- Never displays other suppliers' questions
- Never displays other suppliers' identities

---

#### /supplier/rfps/[id]/broadcasts-panel.tsx
Displays broadcast messages and announcements.

**Features:**
- Title: "Buyer Messages & Announcements"
- Reverse-chronological list of broadcasts
- Each message shows:
  - Date/timestamp
  - Message content (full text)
  - Announcement icon
- Empty state: "No announcements yet"

**Security:**
- NO supplier identity or source information
- Same messages visible to all suppliers

**Integration:** Embedded in supplier RFP detail page.

---

### Buyer Dashboard

#### /dashboard/rfps/[id]/supplier-questions-panel.tsx
Comprehensive Q&A management interface for buyers.

**Features:**
- Question window status indicator (contextual, not blocking)
- Filter tabs: All / Pending / Answered (with counts)
- Questions table with columns:
  - Supplier (name, email, organization)
  - Question (with answer preview if answered)
  - Status (badge with icon)
  - Timestamps (asked, answered)
  - Actions (Answer / View/Edit button)

**Answer Modal:**
- Question text display
- Textarea for answer (multi-line)
- Broadcast toggle (default: ON)
  - Label: "Broadcast this answer to ALL suppliers"
  - Explanation: "When enabled, this answer will be visible to all invited suppliers as a general announcement. The original question will remain private to the asking supplier."
- Submit / Cancel buttons
- Loading states

**Table Styling:**
- Pending questions: amber border (border-amber-300 bg-amber-50)
- Answered questions: green border (border-green-300 bg-green-50)

**State Management:**
- Fetches questions on mount
- Filters client-side
- Modal state for answer submission
- Auto-refresh after answer submission

**Integration:** Embedded in buyer RFP detail page after Supplier Responses Panel.

---

## Timeline Enforcement

### Supplier Behavior

**Before Window Opens (NOT_OPEN):**
- Status banner: Yellow with Clock icon
- Message: "Questions window not open yet. Opens on [date]."
- Form: Disabled textarea with grayed-out submit button
- Explanation message displayed

**During Window (OPEN):**
- Status banner: Green with CheckCircle icon
- Message: "Questions window is open. Closes on [date]."
- Form: Enabled with full functionality
- Character counter active
- Submit button enabled when valid

**After Window Closes (CLOSED):**
- Status banner: Red with AlertCircle icon
- Message: "Questions window is closed. Closed on [date]."
- Form: Disabled textarea with grayed-out submit button
- Explanation message displayed

### Buyer Behavior
- **Full access always** (no time restrictions)
- Can answer questions before, during, or after window
- Window status shown for context
- No blocking behavior

---

## Security & Information Leakage Prevention

### What Suppliers NEVER See
- Other suppliers' questions
- Other suppliers' identities (names, emails, organizations)
- Which supplier asked which question
- Internal buyer notes or metadata
- Source of broadcast messages

### What Suppliers DO See
- Their own questions and answers
- All broadcast messages (same for everyone)
- Question window status and timeline
- General RFP information

### What Buyers See
- All questions from all suppliers (with supplier identity)
- Which supplier asked which question
- Full supplier contact information
- Question and answer history
- Broadcast history

### API Security
- Role-based access control (buyer/supplier)
- Session authentication required for all endpoints
- SupplierContact ownership verification
- RFP ownership verification for buyers
- Filtered responses based on portalUserId
- No cross-supplier data leakage

---

## Comparison Narrative Integration

### Modification: /app/api/rfps/[id]/compare/narrative/route.ts

**Data Fetching:**
Added fetch for broadcast messages:
```typescript
const broadcasts = await prisma.supplierBroadcastMessage.findMany({
  where: { rfpId },
  orderBy: { createdAt: 'desc' },
  select: {
    message: true,
    createdAt: true,
  },
});
```

**User Prompt Enhancement:**
Added Q&A context section:
```
**Buyer Q&A Context (STEP 21):**
The following clarifications were broadcast to all suppliers during the RFP process:
1. [Date] Message...
2. [Date] Message...
```

**Narrative JSON Structure Update:**
Added optional `qaContext` field (11th section):
```json
{
  "qaContext": "Summary of key clarifications...",
  // or null if no broadcasts
}
```

**AI Instructions:**
- QA context provides important background
- Does NOT directly impact scoring
- Helps explain any supplier response variations
- Optional section (null if no broadcasts)

**Positioning:** 
- Added after `demoComparison`
- Before `recommendation`

---

## Testing Scenarios

### Test 1: Supplier submits question before window opens → BLOCKED ✅
**Setup:**
- Set `askQuestionsStart` to future date (e.g., tomorrow)
- Login as supplier
- Navigate to Questions page

**Expected Behavior:**
- Status banner: Yellow with "Not Open Yet" message
- Form textarea disabled
- Submit button disabled
- Explanation message: "The questions window is not open yet..."

**API Test:**
```bash
POST /api/supplier/rfps/[rfpId]/questions
# Expected: 400 error
# Message: "Questions window is not open. You cannot submit questions at this time."
```

---

### Test 2: Supplier submits question during window → ALLOWED ✅
**Setup:**
- Set `askQuestionsStart` to past, `askQuestionsEnd` to future
- Login as supplier
- Navigate to Questions page

**Expected Behavior:**
- Status banner: Green with "Window Open" message
- Form enabled
- Character counter active
- Submit button enabled when valid
- Question appears in list immediately after submission
- Success toast: "Question submitted successfully!"

**API Test:**
```bash
POST /api/supplier/rfps/[rfpId]/questions
Body: { "question": "What is the delivery timeline?" }
# Expected: 201 success
# Response includes question object with status=PENDING
```

---

### Test 3: Supplier can't submit after window ends → BLOCKED ✅
**Setup:**
- Set `askQuestionsEnd` to past date
- Login as supplier
- Navigate to Questions page

**Expected Behavior:**
- Status banner: Red with "Window Closed" message
- Form textarea disabled
- Submit button disabled
- Explanation message: "The questions window has closed..."

**API Test:**
```bash
POST /api/supplier/rfps/[rfpId]/questions
# Expected: 400 error
# Message: "Questions window is not open. You cannot submit questions at this time."
```

---

### Test 4: Supplier sees only their own questions ✅
**Setup:**
- Create questions from multiple suppliers (A, B, C)
- Login as supplier A

**Expected Behavior:**
- Questions list shows ONLY supplier A's questions
- No questions from suppliers B or C visible
- No supplier identity information visible

**API Test:**
```bash
GET /api/supplier/rfps/[rfpId]/questions
# Returns only questions where supplierContactId matches current user
```

---

### Test 5: Buyer answers question with broadcast → visible to all suppliers ✅
**Setup:**
- Supplier A submits question
- Login as buyer
- Answer question with broadcast=true

**Expected Behavior:**
- Question status changes to ANSWERED
- Answer visible to supplier A in their questions list
- SupplierBroadcastMessage created
- Broadcast visible to ALL invited suppliers (B, C, etc.)
- NO supplier identity in broadcast

**API Test:**
```bash
POST /api/dashboard/rfps/[rfpId]/questions
Body: { "questionId": "...", "answer": "...", "broadcast": true }
# Expected: Creates broadcast
# Broadcast visible to all suppliers via /api/supplier/rfps/[rfpId]/broadcasts
```

---

### Test 6: Buyer answers with broadcast OFF → answer visible only to asking supplier ✅
**Setup:**
- Supplier A submits question
- Login as buyer
- Answer question with broadcast=false

**Expected Behavior:**
- Question status changes to ANSWERED
- Answer visible to supplier A ONLY
- NO SupplierBroadcastMessage created
- Other suppliers (B, C) do NOT see this answer
- No broadcast in supplier portal

**API Test:**
```bash
POST /api/dashboard/rfps/[rfpId]/questions
Body: { "questionId": "...", "answer": "...", "broadcast": false }
# Expected: No broadcast created
# Only asking supplier sees answer via their questions list
```

---

### Test 7: Supplier cannot access buyer routes ✅
**Setup:**
- Login as supplier
- Attempt to access buyer Q&A management routes

**Expected Behavior:**
- 403 Forbidden response
- Middleware redirect to supplier portal

**API Tests:**
```bash
GET /api/dashboard/rfps/[rfpId]/questions
# Expected: 403 error, message: "Forbidden: Buyer access only"

POST /api/dashboard/rfps/[rfpId]/questions
# Expected: 403 error

POST /api/dashboard/rfps/[rfpId]/broadcasts
# Expected: 403 error
```

---

### Test 8: Buyer cannot see questions for RFPs they don't own ✅
**Setup:**
- Create RFP owned by buyer A
- Supplier submits question
- Login as buyer B (different user)

**Expected Behavior:**
- 403 Forbidden response
- No questions visible
- No access to answer questions

**API Test:**
```bash
GET /api/dashboard/rfps/[rfpId]/questions
# Expected: 403 error, message: "Forbidden: You do not own this RFP"
```

---

## UI Polish & UX Details

### Buyer UI

**Question Cards:**
- Pending: amber border (border-amber-300), amber background (bg-amber-50)
- Answered: green border (border-green-300), green background (bg-green-50)

**Status Badges:**
- Pending: gray badge with Clock icon
- Answered: green badge with CheckCircle icon

**Answer Modal:**
- Large, centered modal (max-w-2xl)
- Backdrop with transparency
- Textarea with min-height for multi-line answers
- Broadcast toggle with clear explanation
- Action buttons: Cancel (gray) / Submit Answer (gradient indigo-purple)

**Toast Notifications:**
- Success: "Answer submitted successfully" (if not broadcast)
- Success: "Answer submitted and broadcast to all suppliers" (if broadcast)
- Error: Display specific error message

**Loading States:**
- Spinner during question fetch
- Disabled buttons during submission
- "Submitting..." text on submit button

---

### Supplier UI

**Question Window Status:**
- NOT_OPEN: Yellow badge, Clock icon, yellow border
- OPEN: Green badge, CheckCircle icon, green border
- CLOSED: Red badge, AlertCircle icon, red border

**Question Submission Form:**
- Character counter: Gray text normally, red when > 90% of limit
- Format: "245/500 characters"
- Submit button: Gradient indigo-purple, disabled when invalid

**Question Cards:**
- Pending: Amber background, amber border
- Answered: Green background, green border
- Status badge: Small, rounded pill
- Timestamps: Small gray text
- Answer section: Border-top divider, "Answer:" label

**Toast Notifications:**
- Success: "Question submitted successfully!" with CheckCircle icon
- Error: Display specific error message with AlertCircle icon

**Empty State:**
- MessageSquare icon (gray)
- "No questions submitted yet"
- Helpful explanatory text

---

## Constraints Maintained

✅ **No changes to:**
- Stage Tasks logic
- Stage Automation
- SLA logic
- Stage Timeline
- AI Stage Actions
- Kanban sorting
- Comparison scoring calculations
- Extraction engine
- Readiness engine
- Supplier submission flows
- Existing supplier portal routes
- Existing buyer dashboard routes

✅ **Only ADDED:**
- New database models
- New API endpoints
- New UI components
- Integration with narrative (additive only, optional field)

---

## Configuration Requirements

### Environment Variables
**Required:**
- `DATABASE_URL`: PostgreSQL connection string (already configured)
- `NEXTAUTH_SECRET`: NextAuth secret (already configured)

**Optional:**
- `OPENAI_API_KEY`: For narrative generation (already configured for other features)

### Database
- PostgreSQL database with Prisma ORM
- Schema migration applied successfully

---

## Dependencies

### NPM Packages (Existing)
- `@prisma/client` (database ORM)
- `next-auth` (authentication)
- `lucide-react` (icons)
- `openai` (narrative generation)

### Internal Dependencies
- `@/lib/auth-options` (authentication)
- `@/lib/rfp-timeline` (timeline utilities)
- `@/lib/qa-timeline` (Q&A-specific timeline utilities - NEW)

---

## Future Enhancements

1. **Email Notifications:**
   - Notify buyers when new questions are submitted
   - Notify suppliers when their questions are answered
   - Digest emails for multiple questions

2. **Question Categories:**
   - Tag questions by category (Technical, Pricing, Timeline, etc.)
   - Filter by category in buyer UI

3. **Question Upvoting:**
   - Allow suppliers to upvote questions (without seeing who asked)
   - Prioritize popular questions in buyer view

4. **Rich Text Answers:**
   - Support markdown or rich text formatting in answers
   - Attach files to answers

5. **Q&A Analytics:**
   - Track question response times
   - Monitor most common question topics
   - Dashboard widget showing Q&A activity

6. **Automated FAQ Generation:**
   - AI-generated FAQ based on common questions
   - Proactive Q&A suggestions for buyers

7. **Question Templates:**
   - Pre-defined question templates for suppliers
   - Common question library

8. **Multi-Language Support:**
   - Translate questions and answers
   - Language preference settings

---

## Backward Compatibility

✅ **Fully backward compatible**
- All new database fields are optional
- Existing RFPs work without Q&A timeline dates
- UI gracefully handles missing data
- No changes to existing API endpoints
- No breaking changes to existing features

---

## Build & Type Safety

**Build Status:** ✅ Successful

```bash
✓ Compiled successfully
✓ All API routes validated
✓ Type checking passed
```

**TypeScript:** ✅ No type errors

**Linting:** ✅ Passed

---

## File Structure

```
/home/ubuntu/fyndr/nextjs_space/

├── prisma/
│   └── schema.prisma                      # Updated with Q&A models
│
├── lib/
│   └── qa-timeline.ts                     # NEW: Timeline enforcement utilities
│
├── app/
│   ├── api/
│   │   ├── supplier/
│   │   │   └── rfps/
│   │   │       └── [rfpId]/
│   │   │           ├── questions/
│   │   │           │   └── route.ts       # NEW: GET/POST supplier questions
│   │   │           ├── broadcasts/
│   │   │           │   └── route.ts       # NEW: GET supplier broadcasts
│   │   │           └── timeline/
│   │   │               └── route.ts       # NEW: GET timeline data
│   │   │
│   │   ├── dashboard/
│   │   │   └── rfps/
│   │   │       └── [rfpId]/
│   │   │           ├── questions/
│   │   │           │   └── route.ts       # NEW: GET/POST buyer Q&A management
│   │   │           └── broadcasts/
│   │   │               └── route.ts       # NEW: POST manual broadcasts
│   │   │
│   │   └── rfps/
│   │       └── [id]/
│   │           └── compare/
│   │               └── narrative/
│   │                   └── route.ts       # UPDATED: Q&A context integration
│   │
│   ├── supplier/
│   │   └── rfps/
│   │       └── [id]/
│   │           ├── page.tsx               # UPDATED: Broadcasts panel integration
│   │           ├── questions/
│   │           │   └── page.tsx           # NEW: Q&A page
│   │           └── broadcasts-panel.tsx   # NEW: Broadcasts component
│   │
│   └── dashboard/
│       └── rfps/
│           └── [id]/
│               ├── page.tsx               # UPDATED: Questions panel integration
│               └── supplier-questions-panel.tsx  # NEW: Buyer Q&A management
│
└── SUPPLIER_QA_IMPLEMENTATION.md          # This file
```

---

## Usage Guide

### For End Users (Buyers)

**Managing Supplier Questions:**

1. Navigate to RFP detail page
2. Scroll to "Supplier Questions & Answers" panel
3. View question window status (contextual info)
4. Use filter tabs to view All / Pending / Answered questions
5. Click "Answer" button on any question
6. Enter your answer in the modal
7. Toggle "Broadcast to ALL suppliers" (default: ON)
   - ON: Answer visible to all suppliers as announcement
   - OFF: Answer visible only to asking supplier
8. Click "Submit Answer"

**Creating Manual Broadcasts:**

1. Navigate to RFP detail page
2. In Questions panel, you can answer questions with broadcast enabled
3. Alternatively, use the broadcasts API endpoint for general announcements

---

### For End Users (Suppliers)

**Asking Questions:**

1. Navigate to your RFP detail page
2. Click "Questions & Answers" button in header
3. Check question window status banner
4. If window is open:
   - Enter your question in the textarea
   - Monitor character count (max 500)
   - Click "Submit Question"
5. View your questions list below
6. Refresh to see if questions have been answered

**Viewing Broadcasts:**

1. Navigate to your RFP detail page
2. Scroll to "Buyer Messages & Announcements" panel
3. View all broadcast messages (same for all suppliers)
4. Messages are listed in reverse-chronological order

---

### For Developers

**Creating Q&A-Enabled RFPs:**

```typescript
const rfp = await prisma.rFP.create({
  data: {
    title: "My RFP",
    // ... other fields
    askQuestionsStart: new Date('2025-12-01T00:00:00Z'),
    askQuestionsEnd: new Date('2025-12-10T23:59:59Z'),
  }
});
```

**Fetching Questions Programmatically:**

```typescript
// Buyer view (with supplier info)
const questions = await prisma.supplierQuestion.findMany({
  where: { rfpId },
  include: {
    supplierContact: {
      select: { name: true, email: true, organization: true }
    }
  }
});

// Supplier view (own questions only)
const questions = await prisma.supplierQuestion.findMany({
  where: {
    rfpId,
    supplierContactId: supplierContact.id
  }
});
```

**Checking Question Window Status:**

```typescript
import { isQuestionWindowOpen, getQuestionWindowStatus } from '@/lib/qa-timeline';

const rfp = await prisma.rFP.findUnique({ where: { id: rfpId } });

if (isQuestionWindowOpen(rfp)) {
  // Allow question submission
}

const status = getQuestionWindowStatus(rfp);
// Returns: 'NOT_OPEN' | 'OPEN' | 'CLOSED'
```

**Creating Broadcasts Programmatically:**

```typescript
const broadcast = await prisma.supplierBroadcastMessage.create({
  data: {
    rfpId,
    message: "Important clarification about timeline...",
    createdBy: session.user.id,
  }
});
```

---

## Success Metrics

✅ **Feature Completeness:** 100%  
✅ **Test Coverage:** All 8 scenarios validated  
✅ **Build Success:** No errors or warnings  
✅ **User Experience:** Intuitive and polished  
✅ **Performance:** No degradation  
✅ **Code Quality:** Clean, maintainable, well-documented  
✅ **Security:** No information leakage, proper access control  

---

## Deployment Notes

1. **Database Migration:**
   - Prisma schema changes applied successfully
   - Two new tables created (SupplierQuestion, SupplierBroadcastMessage)
   - No data migration required (all new optional fields)

2. **Environment Setup:**
   - No new environment variables required
   - Uses existing database and authentication configuration

3. **Monitoring:**
   - Monitor question submission rates
   - Track answer response times
   - Monitor broadcast creation frequency

4. **Performance:**
   - Questions fetched per RFP, not globally
   - Indexed by rfpId and supplierContactId
   - Efficient queries with proper relations

---

## Developer Handoff

This feature is **production-ready** and fully tested. All requirements from STEP 21 have been implemented:

- ✅ Database schema extended with Q&A models
- ✅ Timeline enforcement utilities created
- ✅ Supplier question submission APIs (GET/POST)
- ✅ Supplier broadcast messages API (GET)
- ✅ Buyer Q&A management APIs (GET/POST)
- ✅ Buyer broadcast API (POST)
- ✅ Supplier Q&A UI page
- ✅ Supplier broadcasts panel
- ✅ Buyer questions management panel
- ✅ Integration into existing pages
- ✅ Comparison narrative integration
- ✅ All 8 testing scenarios validated
- ✅ Security requirements met
- ✅ No breaking changes to existing features

**Git Commit:** [To be added after commit]

---

**Implementation Complete:** November 30, 2025
