# STEP 22: Notifications & Reminders Engine - Testing Guide

**Implementation Date:** November 30, 2025  
**Status:** ✅ Complete

---

## Table of Contents

1. [Overview](#overview)
2. [Test Scenarios](#test-scenarios)
3. [Expected Results](#expected-results)
4. [API Testing](#api-testing)
5. [Database Verification](#database-verification)
6. [Validation Checklist](#validation-checklist)

---

## Overview

This testing guide provides comprehensive test scenarios for the Notifications & Reminders Engine. All tests should be performed to ensure the system works correctly for both buyers and suppliers.

---

## Test Scenarios

### 1. Event-Based Notifications

#### Test 1.1: Supplier Response Submitted
**Steps:**
1. Log in as a supplier
2. Navigate to an RFP with open submission window
3. Fill out and submit a response
4. Log out and log in as the buyer (RFP owner)
5. Check the bell icon for unread count
6. Navigate to /dashboard/notifications

**Expected Result:**
- Buyer should see unread notification count badge
- Notification should appear with title "Supplier Response Submitted"
- Message should include supplier name and RFP title
- Notification should be marked as unread (blue background, dot indicator)
- Email should be sent to buyer (if email notifications enabled)

---

#### Test 1.2: Supplier Question Created
**Steps:**
1. Log in as a supplier
2. Navigate to RFP questions page
3. Submit a new question (during Q&A window)
4. Log out and log in as the buyer
5. Check notifications

**Expected Result:**
- Buyer receives "New Supplier Question" notification
- Bell icon shows unread count
- Clicking notification navigates to RFP detail page

---

#### Test 1.3: Supplier Question Answered (Non-Broadcast)
**Steps:**
1. Log in as a buyer
2. Navigate to RFP detail page
3. Go to Q&A panel and answer a specific supplier question
4. Ensure "broadcast" toggle is OFF
5. Log out and log in as the supplier (who asked the question)
6. Check notifications

**Expected Result:**
- Only the specific supplier receives notification
- Notification title: "Your Question Was Answered"
- Email sent to supplier if enabled

---

#### Test 1.4: Broadcast Created
**Steps:**
1. Log in as a buyer
2. Navigate to RFP detail page
3. Go to Q&A panel
4. Either:
   - Answer a question with "Broadcast to ALL suppliers" toggle ON
   - OR create a manual broadcast message
5. Log out and log in as multiple suppliers

**Expected Result:**
- ALL suppliers with portalUserId receive "New Buyer Announcement" notification
- Each supplier can see their own notification
- Suppliers cannot see each other's notifications

---

### 2. Timeline-Based Notifications

#### Test 2.1: Q&A Window Open
**Steps:**
1. As a buyer, create/edit an RFP
2. Set `askQuestionsStart` to today's date
3. Ensure suppliers are invited
4. Call the notification runner: `POST /api/notifications/run`
5. Log in as each supplier

**Expected Result:**
- Each supplier receives "Q&A Window Open" notification
- Notification appears only once per day (idempotent)

---

#### Test 2.2: Q&A Window Closing Soon
**Steps:**
1. Set `askQuestionsEnd` to 3 days from today
2. Call notification runner
3. Check supplier notifications

**Expected Result:**
- Suppliers receive "Q&A Window Closing Soon" notification

---

#### Test 2.3: Submission Window Open
**Steps:**
1. Set `submissionStart` to today's date
2. Call notification runner
3. Check supplier notifications

**Expected Result:**
- Suppliers receive "Response Submission Window Open" notification

---

#### Test 2.4: Submission Deadline Soon
**Steps:**
1. Set `submissionEnd` to 3 days from today
2. Call notification runner
3. Check supplier notifications

**Expected Result:**
- Suppliers receive "Response Deadline Approaching" notification

---

#### Test 2.5: Submission Deadline Passed
**Steps:**
1. Set `submissionEnd` to yesterday
2. Call notification runner
3. Check buyer notifications

**Expected Result:**
- Buyer receives "Response Submission Deadline Passed" notification

---

#### Test 2.6: Demo Window Open
**Steps:**
1. Set `demoWindowStart` to today
2. Call notification runner
3. Check buyer notifications

**Expected Result:**
- Buyer receives "Demo Window Open" notification

---

#### Test 2.7: Award Date Soon
**Steps:**
1. Set `awardDate` to 3 days from today
2. Call notification runner
3. Check buyer notifications

**Expected Result:**
- Buyer receives "Award Date Approaching" notification

---

#### Test 2.8: Award Date Reached
**Steps:**
1. Set `awardDate` to today
2. Call notification runner
3. Check buyer notifications

**Expected Result:**
- Buyer receives "Award Date Reached" notification

---

### 3. Notification Preferences

#### Test 3.1: Disable Email Only
**Steps:**
1. Log in as a buyer
2. Navigate to /dashboard/settings/notifications
3. Turn OFF "Email Notifications"
4. Keep "In-App Notifications" ON
5. Trigger a notification event (e.g., supplier submits response)

**Expected Result:**
- In-app notification is created
- NO email is sent
- Notification appears in notification center

---

#### Test 3.2: Disable Both Email and In-App
**Steps:**
1. Turn OFF both "Email Notifications" and "In-App Notifications"
2. Trigger a notification event

**Expected Result:**
- NO notifications are created
- No email is sent
- Bell icon shows 0 unread

---

#### Test 3.3: Disable Specific Category
**Steps:**
1. Turn OFF "Supplier Responses" notifications
2. Keep other categories enabled
3. Trigger supplier response submission

**Expected Result:**
- NO notification created for supplier response
- Other categories still work

---

#### Test 3.4: Supplier Preferences
**Steps:**
1. Log in as a supplier
2. Navigate to /supplier/settings/notifications
3. Disable "Q&A Timeline"
4. Trigger Q&A window opening event

**Expected Result:**
- Supplier does NOT receive Q&A window notification
- Other notification types still work

---

### 4. Notification Center UI

#### Test 4.1: View Notification List
**Steps:**
1. Log in as a buyer with several notifications
2. Navigate to /dashboard/notifications

**Expected Result:**
- Notifications displayed in reverse-chronological order
- Unread notifications have blue background and dot indicator
- Read notifications have normal background
- Relative time displayed (e.g., "2 hours ago")
- Category badges color-coded correctly

---

#### Test 4.2: Mark as Read
**Steps:**
1. Click the check button on an unread notification
2. Observe the UI update
3. Check bell icon unread count

**Expected Result:**
- Notification immediately marked as read (optimistic update)
- Blue background and dot removed
- Unread count decreases by 1

---

#### Test 4.3: Navigate to RFP
**Steps:**
1. Click on a notification with associated rfpId
2. Observe navigation

**Expected Result:**
- Automatically navigates to RFP detail page
- Notification marked as read
- URL is correct (`/dashboard/rfps/[id]`)

---

#### Test 4.4: Empty State
**Steps:**
1. Create a new buyer account with no notifications
2. Navigate to /dashboard/notifications

**Expected Result:**
- Empty state message displayed
- Bell icon shows
- "Back to RFPs" button visible

---

### 5. Bell Icon Functionality

#### Test 5.1: Unread Count Display
**Steps:**
1. Create 3 unread notifications
2. Check bell icon in header

**Expected Result:**
- Red badge shows "3"
- BellDot icon displayed (instead of plain Bell)

---

#### Test 5.2: Unread Count Updates
**Steps:**
1. Mark one notification as read
2. Wait a few seconds for poll
3. Check bell icon

**Expected Result:**
- Badge updates to "2"
- Polls every 30 seconds

---

#### Test 5.3: Bell Icon Navigation
**Steps:**
1. Click the bell icon
2. Observe navigation

**Expected Result:**
- Navigates to /dashboard/notifications (buyer)
- Navigates to /supplier/notifications (supplier)

---

### 6. Readiness Indicator Updates (Optional)

#### Test 6.1: Readiness Recalculation
**Steps:**
1. As a buyer, run readiness calculation: `POST /api/dashboard/rfps/[id]/comparison/readiness`
2. Check notifications

**Expected Result:**
- Buyer receives "Supplier Readiness Updated" notification

---

### 7. Comparison Report Ready (Optional)

#### Test 7.1: Report Generation
**Steps:**
1. As a buyer, generate comparison report: `POST /api/rfps/[id]/compare/report`
2. Check notifications

**Expected Result:**
- Buyer receives "Comparison Report Ready" notification
- Clicking notification navigates to RFP detail page

---

## API Testing

### Test Notification Runner
```bash
# Log in as buyer, then:
curl -X POST https://[your-domain]/api/notifications/run \
  -H "Cookie: [your-session-cookie]" \
  -H "Content-Type: application/json"

# Expected Response:
{
  "success": true,
  "processedRfps": 5,
  "notificationsCreated": 3,
  "timestamp": "2025-11-30T...",
  "message": "Processed 5 RFPs and created 3 notifications"
}
```

---

### Test Unread Count
```bash
curl -X GET https://[your-domain]/api/notifications/unread-count \
  -H "Cookie: [your-session-cookie]"

# Expected Response:
{
  "count": 5
}
```

---

### Test Mark as Read
```bash
curl -X PATCH https://[your-domain]/api/notifications/[id]/read \
  -H "Cookie: [your-session-cookie]"

# Expected Response:
{
  "success": true,
  "notification": { ... }
}
```

---

### Test Preferences API
```bash
# GET preferences
curl -X GET https://[your-domain]/api/settings/notifications \
  -H "Cookie: [your-session-cookie]"

# POST preferences
curl -X POST https://[your-domain]/api/settings/notifications \
  -H "Cookie: [your-session-cookie]" \
  -H "Content-Type: application/json" \
  -d '{
    "emailEnabled": false,
    "inAppEnabled": true,
    "buyerRfpTimeline": true
  }'
```

---

## Database Verification

### Check Notification Records
```sql
SELECT 
  id, 
  userId, 
  type, 
  category, 
  title, 
  message, 
  readAt, 
  createdAt,
  rfpId
FROM "Notification"
ORDER BY createdAt DESC
LIMIT 10;
```

---

### Check Notification Preferences
```sql
SELECT 
  userId,
  emailEnabled,
  inAppEnabled,
  buyerRfpTimeline,
  buyerSupplierResponses,
  supplierQATimeline,
  supplierSubmissionTimeline
FROM "NotificationPreference"
WHERE userId = '[user-id]';
```

---

### Check Duplicate Prevention
```sql
-- Should return 0 or 1 for a given user/rfp/type on the same day
SELECT COUNT(*) as duplicate_count
FROM "Notification"
WHERE userId = '[user-id]'
  AND rfpId = '[rfp-id]'
  AND type = 'RFP_TIMELINE_QA_WINDOW_OPEN'
  AND createdAt >= CURRENT_DATE;
```

---

## Validation Checklist

### Schema Changes
- [ ] `Notification` model created with all fields
- [ ] `NotificationPreference` model created with all toggles
- [ ] `User` model updated with relations
- [ ] Prisma migration successful

---

### API Endpoints
- [ ] `POST /api/notifications/run` works
- [ ] `GET /api/notifications/unread-count` returns correct count
- [ ] `PATCH /api/notifications/[id]/read` marks as read
- [ ] `GET /api/settings/notifications` returns preferences
- [ ] `POST /api/settings/notifications` updates preferences

---

### Event Hooks
- [ ] Supplier response submission triggers notification
- [ ] Supplier question creation triggers notification
- [ ] Buyer answering question triggers notification
- [ ] Broadcast creation triggers notifications to all suppliers
- [ ] Readiness update triggers notification (optional)
- [ ] Report generation triggers notification (optional)

---

### Timeline Reminders
- [ ] Q&A window open notifications sent
- [ ] Q&A window closing soon notifications sent
- [ ] Submission window open notifications sent
- [ ] Submission deadline soon notifications sent
- [ ] Submission deadline passed notification sent
- [ ] Demo window open notification sent
- [ ] Award date soon notification sent
- [ ] Award date reached notification sent

---

### UI Components
- [ ] Buyer notification center displays correctly
- [ ] Buyer preferences page works
- [ ] Supplier notification center displays correctly
- [ ] Supplier preferences page works
- [ ] Buyer bell icon shows unread count
- [ ] Supplier bell icon shows unread count

---

### Security
- [ ] Notifications are user-scoped (no data leakage)
- [ ] API endpoints verify authentication
- [ ] API endpoints verify ownership
- [ ] Suppliers cannot access buyer-only routes
- [ ] Buyers cannot see supplier portal notifications

---

### No Breaking Changes
- [ ] All existing RFP flows still work
- [ ] Supplier response submission unchanged
- [ ] Q&A system unchanged
- [ ] Comparison engine unchanged
- [ ] No API response format changes

---

## Common Issues & Fixes

### Issue: Notifications not appearing
**Fix:**
- Check user preferences (may be disabled)
- Verify API authentication
- Check browser console for errors

---

### Issue: Duplicate notifications
**Fix:**
- Verify `checkIfNotificationSentToday()` logic
- Check date comparison functions
- Ensure notification runner not called multiple times

---

### Issue: Bell icon unread count not updating
**Fix:**
- Wait for 30-second poll interval
- Check network tab for API calls
- Verify session is active

---

### Issue: Email notifications not sent
**Fix:**
- Check `RESEND_API_KEY` in `.env`
- Verify `sendEmail()` function works
- Check user email preferences

---

## Performance Checks

### Load Testing
- [ ] Create 100+ notifications for a user
- [ ] Page loads in < 2 seconds
- [ ] Bell icon updates in < 500ms
- [ ] No memory leaks from polling

---

### Database Indexing
- [ ] Index on `(userId, createdAt)` exists
- [ ] Index on `rfpId` exists
- [ ] Queries complete in < 100ms

---

## Next Steps

After completing all tests:
1. Document any issues found
2. Fix critical bugs before deployment
3. Schedule regular notification runner via cron
4. Monitor notification delivery rates
5. Collect user feedback on notification frequency

---

**Testing Complete:** [Date]  
**Tested By:** [Name]  
**Issues Found:** [Count]  
**Status:** [Pass/Fail]
