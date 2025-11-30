# Activity Log Integrations Remaining

## Phase 1 - Remaining 4 Endpoints

### 1. Readiness (app/api/dashboard/rfps/[id]/comparison/readiness/route.ts)
- Import logActivityWithRequest, EVENT_TYPES, ACTOR_ROLES
- After successful readiness calculation
- Event: READINESS_RECALCULATED
- Actor: SYSTEM
- Details: {rfpId, supplierCount, readinessScores}

### 2. Question Answer (app/api/dashboard/rfps/[id]/questions/route.ts)
- Import logActivityWithRequest, EVENT_TYPES, ACTOR_ROLES  
- After answering question
- Event: SUPPLIER_QUESTION_ANSWERED
- Actor: BUYER
- Details: {rfpId, questionId, broadcast, answerText}

### 3. Broadcast (app/api/dashboard/rfps/[id]/broadcasts/route.ts)
- Import logActivityWithRequest, EVENT_TYPES, ACTOR_ROLES
- After creating broadcast
- Event: SUPPLIER_BROADCAST_CREATED
- Actor: BUYER
- Details: {rfpId, broadcastId, messageLength, recipientCount}

### 4. Notifications (app/api/notifications/run/route.ts)
- Import logActivityWithRequest, EVENT_TYPES, ACTOR_ROLES
- After timeline runner completes
- Event: NOTIFICATION_SENT  
- Actor: SYSTEM
- Details: {processedRfps, notificationsCreated}

## Proceed to Phase 2 after completing Phase 1
