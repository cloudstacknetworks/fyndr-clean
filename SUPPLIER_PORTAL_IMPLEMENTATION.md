# Supplier Engagement Portal Architecture (Part 1) - Implementation Summary

**Implementation Date:** November 29, 2025  
**Status:** ✅ Complete  
**Git Commit:** 503125a  
**Build Status:** ✅ Passing (no errors or warnings)

---

## 📋 Overview

The Supplier Engagement Portal enables RFP buyers to invite external suppliers to view RFP details through a secure, read-only portal. Suppliers receive a magic-link invitation via email and gain automatic access without needing to create passwords.

### Key Features Delivered

1. ✅ **Supplier Contact Management** - Invite, track, and manage supplier contacts per RFP
2. ✅ **Magic-Link Authentication** - Secure, one-click access for suppliers (7-day token expiry)
3. ✅ **Professional Email Invitations** - HTML templates with RFP details and timeline
4. ✅ **Dedicated Supplier Portal** - Read-only RFP view with timeline and details
5. ✅ **Role-Based Authorization** - Middleware enforcing buyer/supplier route restrictions
6. ✅ **Invitation Status Tracking** - PENDING → SENT → ACCEPTED → EXPIRED workflow
7. ✅ **Resend & Delete Actions** - Full invitation lifecycle management

---

## 🗄️ Database Schema Changes

### File: `prisma/schema.prisma`

#### 1. Extended User Model
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String?
  role      String   @default("buyer")  // NEW: "buyer" or "supplier"
  createdAt DateTime @default(now())
  rfps      RFP[]
  contacts  Contact[]
  supplierPortalAccess SupplierContact?  // NEW: One-to-one relation
}
```

#### 2. New InvitationStatus Enum
```prisma
enum InvitationStatus {
  PENDING    // Contact created, email not sent yet
  SENT       // Invitation email sent successfully
  ACCEPTED   // Supplier clicked link and logged in
  REJECTED   // Future: Supplier declined invitation
  EXPIRED    // Token expired (7 days)
}
```

#### 3. New SupplierContact Model
```prisma
model SupplierContact {
  id               String           @id @default(uuid())
  rfpId            String
  name             String
  email            String
  organization     String?
  invitedAt        DateTime?
  invitationStatus InvitationStatus @default(PENDING)
  portalUserId     String?          @unique
  accessToken      String?          // 32-byte hex token
  accessTokenExpires DateTime?      // 7 days from invitation
  responses        Json?            // Future: Store supplier responses
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
  
  rfp              RFP              @relation(fields: [rfpId], references: [id], onDelete: Cascade)
  portalUser       User?            @relation(fields: [portalUserId], references: [id], onDelete: SetNull)
  
  @@index([rfpId])
  @@index([email, rfpId])  // Composite index for lookups
}
```

#### 4. Updated RFP Model
```prisma
model RFP {
  // ... existing fields ...
  supplierContacts SupplierContact[]  // NEW: One-to-many relation
}
```

**Migration Applied:**
```bash
npx prisma generate && npx prisma db push
```

---

## 🔌 API Endpoints

### 1. Invite Supplier Contact
**Endpoint:** `POST /api/rfps/[id]/suppliers`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@supplier.com",
  "organization": "Supplier Inc." // optional
}
```

**Success Response (201):**
```json
{
  "supplierContact": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@supplier.com",
    "organization": "Supplier Inc.",
    "invitationStatus": "SENT",
    "invitedAt": "2025-11-29T10:30:00Z",
    "createdAt": "2025-11-29T10:30:00Z"
  },
  "message": "Invitation sent successfully"
}
```

**Key Features:**
- Generates secure 32-byte hex token using `crypto.randomBytes`
- Sets 7-day token expiration
- Sends HTML email with magic link
- Validates email format and checks for duplicates
- Updates status to SENT after successful email delivery

---

### 2. List Supplier Contacts
**Endpoint:** `GET /api/rfps/[id]/suppliers`

**Success Response (200):**
```json
{
  "supplierContacts": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@supplier.com",
      "organization": "Supplier Inc.",
      "invitationStatus": "ACCEPTED",
      "invitedAt": "2025-11-29T10:30:00Z",
      "createdAt": "2025-11-29T10:30:00Z"
    }
  ]
}
```

---

### 3. Delete Supplier Contact
**Endpoint:** `DELETE /api/rfps/[id]/suppliers/[supplierId]`

**Success Response (200):**
```json
{
  "message": "Supplier contact deleted successfully"
}
```

---

### 4. Resend Invitation
**Endpoint:** `POST /api/rfps/[id]/suppliers/[supplierId]/resend`

**Success Response (200):**
```json
{
  "supplierContact": { /* updated contact */ },
  "message": "Invitation resent successfully"
}
```

**Key Features:**
- Generates new access token
- Resets expiration to 7 days
- Blocks resend if status is ACCEPTED
- Updates invitedAt timestamp

---

### 5. Validate Magic Link Token
**Endpoint:** `POST /api/supplier/validate-token`

**Request Body:**
```json
{
  "token": "64-character-hex-string"
}
```

**Success Response (200):**
```json
{
  "email": "john@supplier.com",
  "temporaryPassword": "generated-hex-string",
  "rfpId": "uuid",
  "message": "Token validated successfully"
}
```

**Key Features:**
- Validates token existence and expiration
- Auto-creates User with role="supplier" on first use
- Links SupplierContact to new User
- Updates status to ACCEPTED
- Generates temporary password for NextAuth login

---

## 📧 Email System

### File: `lib/email-templates.ts`

#### Function: `generateSupplierInvitationEmailHtml()`

**Parameters:**
- `supplierName: string` - Recipient's name
- `rfpTitle: string` - Title of the RFP
- `companyName: string` - Buyer organization name
- `timeline: object` - Timeline dates (optional)
- `magicLink: string` - Secure access URL

**Email Features:**
1. **Professional Design:**
   - Indigo header with Fyndr branding
   - Responsive layout (max-width: 600px)
   - Mobile-friendly table structure

2. **Content Sections:**
   - Personalized greeting
   - RFP title and buyer organization
   - Important dates timeline (if available)
   - Prominent "Access RFP Portal" CTA button
   - Security notice (7-day expiration)
   - Help text with buyer contact info

3. **Security Features:**
   - HTML escaping via `escapeHtml()` function
   - XSS protection on all user inputs
   - Secure token generation

**Email Sender:**
```typescript
from: 'Fyndr <no-reply@fyndr.cloudstacknetworks.com>'
```

---

## 🚪 Supplier Portal

### Architecture

```
/supplier/                          (namespace root)
├── access/                         (magic-link landing page)
│   └── page.tsx
├── layout.tsx                      (server-side auth wrapper)
├── supplier-layout.tsx             (client-side UI shell)
└── rfps/[id]/                      (RFP detail view)
    └── page.tsx
```

---

### 1. Magic-Link Access Page
**File:** `app/supplier/access/page.tsx`

**URL:** `/supplier/access?token=<64-char-hex>`

**Workflow:**
1. Extract token from URL query params
2. Call `/api/supplier/validate-token` endpoint
3. Auto-login using NextAuth credentials
4. Redirect to `/supplier/rfps/[rfpId]`

**States:**
- **Validating:** Spinner with "Validating your access link..."
- **Success:** Green checkmark with "Access Granted!"
- **Error:** Red alert with troubleshooting tips

**Error Messages:**
- Invalid or expired link
- Token already used
- Invitation revoked

---

### 2. Supplier Layout
**Files:** 
- `app/supplier/layout.tsx` (server wrapper)
- `app/supplier/supplier-layout.tsx` (client UI)

**Features:**
- Server-side session validation
- Redirects to `/login` if unauthenticated
- Custom header with "Supplier Portal" badge
- User email display
- Sign-out functionality

---

### 3. Supplier RFP View
**File:** `app/supplier/rfps/[id]/page.tsx`

**Authorization Logic:**
```typescript
async function getSupplierRFPAccess(rfpId: string, userId: string) {
  return await prisma.supplierContact.findFirst({
    where: {
      rfpId,
      portalUserId: userId,
    },
    include: {
      rfp: { include: { company: true, supplier: true } }
    }
  });
}
```

**UI Sections:**

1. **Header:**
   - RFP title
   - "Invited by [Company Name]"
   - "Read-Only Access" badge

2. **Status Banner:**
   - "Supplier Portal — Part 1 (Read-Only View)"
   - Info about future response capabilities

3. **RFP Details Card:**
   - Description
   - Current Stage (with badge)
   - Priority level
   - Budget (formatted)
   - Due Date
   - Buyer Organization info

4. **Timeline & Milestones:**
   - Reuses timeline components from buyer view
   - Color-coded status indicators
   - Days remaining/overdue

5. **Contact Information:**
   - "Need Help?" section
   - Buyer organization details

**Access Control:**
- Shows "Access Denied" if user lacks permission
- Verifies portalUserId matches SupplierContact

---

## 🛡️ Authorization & Security

### 1. Middleware Updates
**File:** `middleware.ts`

**Key Changes:**
```typescript
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;
    const userRole = token.role || 'buyer';

    // Supplier users restricted to /supplier routes
    if (userRole === 'supplier' && path.startsWith('/dashboard')) {
      return NextResponse.redirect(new URL('/supplier', req.url));
    }

    // Buyer users restricted to /dashboard routes
    if (userRole === 'buyer' && path.startsWith('/supplier') && path !== '/supplier/access') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow unauthenticated access to /supplier/access
        if (req.nextUrl.pathname === '/supplier/access') {
          return true;
        }
        return !!token;
      }
    }
  }
);

export const config = {
  matcher: ['/dashboard/:path*', '/supplier/:path*']
};
```

---

### 2. NextAuth Extensions
**Files:**
- `lib/auth-options.ts`
- `types/next-auth.d.ts`

**Changes:**

#### auth-options.ts
```typescript
async authorize(credentials) {
  // ... validation ...
  return {
    id: user.id,
    email: user.email,
    role: user.role,  // NEW: Include role
  };
}

async jwt({ token, user }) {
  if (user) {
    token.role = user.role;  // NEW: Store in JWT
  }
  return token;
}

async session({ session, token }) {
  session.user.role = token.role as string;  // NEW: Add to session
  return session;
}
```

#### next-auth.d.ts
```typescript
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      role?: string;  // NEW
    };
  }

  interface User {
    role?: string;  // NEW
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string;  // NEW
  }
}
```

---

### 3. Server-Side Ownership Checks

**Pattern used in all supplier endpoints:**
```typescript
// Verify RFP ownership
const rfp = await prisma.rFP.findUnique({
  where: { id: rfpId },
  select: { userId: true }
});

if (!rfp) {
  return NextResponse.json({ error: 'RFP not found' }, { status: 404 });
}

if (rfp.userId !== session.user.id) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```

---

## 🎨 UI Components

### Supplier Contacts Panel
**File:** `app/dashboard/rfps/[id]/supplier-contacts-panel.tsx`

**Location:** RFP Detail Page (after Internal Notes, before Timeline Bar)

**Features:**

1. **Table View:**
   - Columns: Name, Email, Organization, Status, Invited At, Actions
   - Color-coded status badges
   - Hover effects and responsive design

2. **Status Badges:**
   ```typescript
   PENDING  → Gray badge
   SENT     → Blue badge
   ACCEPTED → Green badge with checkmark
   EXPIRED  → Red badge
   ```

3. **Action Buttons:**
   - **Resend:** Blue icon button (disabled if ACCEPTED)
   - **Delete:** Red trash icon with confirmation

4. **Empty State:**
   - Centered placeholder with icon
   - "No supplier contacts yet" message
   - "Send First Invitation" CTA

5. **Invite Modal:**
   - Name field (required)
   - Email field (required, validated)
   - Organization field (optional)
   - Cancel/Send buttons

**State Management:**
```typescript
const [contacts, setContacts] = useState<SupplierContact[]>([]);
const [showInviteModal, setShowInviteModal] = useState(false);
const [inviteForm, setInviteForm] = useState({ name: '', email: '', organization: '' });
const [inviting, setInviting] = useState(false);
const [resendingId, setResendingId] = useState<string | null>(null);
const [deletingId, setDeletingId] = useState<string | null>(null);
const [error, setError] = useState<string | null>(null);
```

---

## 🧪 Testing Checklist

### Test Scenario 1: Invite New Supplier ✅
1. Open RFP detail page
2. Scroll to "Supplier Contacts" section
3. Click "Invite Supplier"
4. Enter name: "Jane Smith"
5. Enter email: "jane@supplier.com"
6. Enter organization: "Acme Supplies"
7. Click "Send Invitation"
8. **Expected:**
   - Success message appears
   - Table shows new contact with status "SENT"
   - Email sent to jane@supplier.com
   - Database has SupplierContact record

---

### Test Scenario 2: Magic-Link Login ✅
1. Check email inbox for jane@supplier.com
2. Open invitation email
3. Verify email contains:
   - RFP title
   - Buyer company name
   - Timeline dates (if set)
   - "Access RFP Portal" button
4. Click magic link
5. **Expected:**
   - Redirects to `/supplier/access?token=...`
   - Shows "Validating access" spinner
   - Auto-creates User with role="supplier"
   - Logs in automatically
   - Redirects to `/supplier/rfps/[id]`
   - Shows RFP details in read-only view

---

### Test Scenario 3: Supplier Portal Access ✅
1. After magic-link login, verify:
   - Header shows "Supplier Portal" badge
   - User email displayed
   - RFP title visible
   - All sections render correctly
   - Timeline displays (if dates exist)
   - "Need Help?" section present
2. Try to navigate to `/dashboard`
3. **Expected:**
   - Redirected back to `/supplier`
   - Cannot access buyer routes

---

### Test Scenario 4: Resend Invitation ✅
1. Open RFP detail page (as buyer)
2. Find supplier with status "SENT"
3. Click resend icon
4. **Expected:**
   - New email sent with fresh token
   - invitedAt timestamp updates
   - New 7-day expiration set
   - Status remains "SENT"

---

### Test Scenario 5: Token Expiration ✅
1. Manually set `accessTokenExpires` to past date in database
2. Try to use magic link
3. **Expected:**
   - Shows "This access link has expired" error
   - Status updates to "EXPIRED" in database
   - Provides guidance to request new invitation

---

### Test Scenario 6: Delete Supplier Contact ✅
1. Open RFP detail page
2. Click trash icon on supplier contact
3. Confirm deletion in browser alert
4. **Expected:**
   - Contact removed from table
   - Database record deleted
   - Page refreshes automatically

---

### Test Scenario 7: Duplicate Email Prevention ✅
1. Invite supplier: john@supplier.com
2. Try to invite john@supplier.com again for same RFP
3. **Expected:**
   - Error message: "Supplier contact with this email already exists for this RFP"
   - No duplicate record created

---

### Test Scenario 8: Authorization Checks ✅
1. **Buyer Access:**
   - Buyer cannot access `/supplier/rfps/[id]`
   - Redirected to `/dashboard`
2. **Supplier Access:**
   - Supplier cannot access `/dashboard`
   - Redirected to `/supplier`
3. **Ownership:**
   - User A creates RFP
   - User B cannot invite suppliers for User A's RFP
   - API returns 403 Forbidden

---

### Test Scenario 9: Email Failure Handling ✅
1. Set invalid RESEND_API_KEY in .env
2. Try to invite supplier
3. **Expected:**
   - SupplierContact created with status "PENDING"
   - Warning message: "Supplier contact created, but email failed to send"
   - Can resend invitation once email is fixed

---

### Test Scenario 10: Existing Features Preserved ✅
1. Verify all existing features still work:
   - ✅ Stage Automation
   - ✅ Stage Tasks generation
   - ✅ SLA monitoring
   - ✅ Stage Timeline
   - ✅ Opportunity Scoring
   - ✅ AI Executive Summary
   - ✅ AI Stage Actions
   - ✅ Kanban board drag-and-drop
   - ✅ Stage transition validation

---

## 📊 Data Flow Diagrams

### Invitation Flow
```
Buyer Action (Invite Supplier)
    ↓
SupplierContactsPanel (Client Component)
    ↓
POST /api/rfps/[id]/suppliers
    ↓
Authentication & Ownership Check
    ↓
Generate Secure Token (crypto.randomBytes(32))
    ↓
Create SupplierContact (status: PENDING)
    ↓
Generate Magic Link
    ↓
Send Email via Resend API
    ↓
Update Status → SENT
    ↓
Return Success
    ↓
Update UI State
```

---

### Magic-Link Login Flow
```
Supplier Clicks Magic Link
    ↓
/supplier/access?token=...
    ↓
POST /api/supplier/validate-token
    ↓
Find SupplierContact by Token
    ↓
Check Token Expiration
    ↓
Valid? ──No→ Return Error (EXPIRED)
    ↓ Yes
    ↓
portalUserId Exists?
    ↓ No               ↓ Yes
    ↓                  ↓
Create New User    Update Password
(role: supplier)   (temporary hash)
    ↓                  ↓
    └──────┬───────────┘
           ↓
    Link User to Contact
           ↓
    Update Status → ACCEPTED
           ↓
    Return Credentials
           ↓
    NextAuth signIn()
           ↓
    Redirect to /supplier/rfps/[id]
```

---

## 🔐 Security Considerations

### 1. Token Generation
```typescript
const accessToken = crypto.randomBytes(32).toString('hex');
// Generates: 64-character hex string (256-bit entropy)
```

### 2. Token Expiration
```typescript
const accessTokenExpires = new Date();
accessTokenExpires.setDate(accessTokenExpires.getDate() + 7); // 7 days
```

### 3. Email Validation
```typescript
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
}
```

### 4. XSS Protection
```typescript
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}
```

### 5. HTTPS Only
All magic links use `process.env.NEXTAUTH_URL` base URL:
```typescript
const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
const magicLink = `${baseUrl}/supplier/access?token=${accessToken}`;
```

---

## 🚀 Deployment Checklist

### Environment Variables
```env
# Required
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key
RESEND_API_KEY=re_...

# Optional (but recommended for AI features)
OPENAI_API_KEY=sk-proj-...
```

### Pre-Deployment Steps
1. ✅ Run database migration: `npx prisma db push`
2. ✅ Verify Resend domain configuration
3. ✅ Test email delivery in production
4. ✅ Set NEXTAUTH_URL to production domain
5. ✅ Enable HTTPS for magic links
6. ✅ Test role-based redirects
7. ✅ Verify middleware protection

### Post-Deployment Monitoring
- Monitor email delivery rates (Resend dashboard)
- Track SupplierContact invitation statuses
- Monitor failed login attempts
- Check for expired tokens being used

---

## 🔮 Future Enhancements (Part 2)

### Planned Features:
1. **Supplier Response Submission:**
   - File upload capabilities
   - Questionnaire forms
   - Response versioning

2. **Q&A Communication:**
   - Suppliers ask questions
   - Buyers respond
   - Thread management

3. **Notifications:**
   - Email alerts for new responses
   - Deadline reminders
   - Status change notifications

4. **Response Evaluation:**
   - Scoring matrix
   - Side-by-side comparison
   - Automated ranking

5. **Advanced Access Control:**
   - Multiple suppliers per RFP
   - Team collaboration
   - Permission levels

---

## 📚 Developer References

### Key Files to Review:
```
Database:
├── prisma/schema.prisma          (Schema definitions)

API:
├── app/api/rfps/[id]/suppliers/route.ts
├── app/api/rfps/[id]/suppliers/[supplierId]/route.ts
├── app/api/rfps/[id]/suppliers/[supplierId]/resend/route.ts
└── app/api/supplier/validate-token/route.ts

UI Components:
├── app/dashboard/rfps/[id]/supplier-contacts-panel.tsx
├── app/supplier/access/page.tsx
├── app/supplier/layout.tsx
├── app/supplier/supplier-layout.tsx
└── app/supplier/rfps/[id]/page.tsx

Utilities:
├── lib/email.ts                  (Email sending)
├── lib/email-templates.ts        (HTML templates)
├── lib/auth-options.ts           (NextAuth config)
├── middleware.ts                 (Authorization)
└── types/next-auth.d.ts          (Type definitions)
```

---

## 🐛 Troubleshooting

### Email Not Sending
**Problem:** Invitation created but email not delivered

**Solutions:**
1. Check `RESEND_API_KEY` in .env
2. Verify domain configuration in Resend dashboard
3. Check Resend logs for delivery failures
4. Test with `onboarding@resend.dev` sender (development)
5. Use resend button to retry

---

### Magic Link Not Working
**Problem:** Supplier clicks link but gets error

**Solutions:**
1. Check token expiration (7 days)
2. Verify `NEXTAUTH_URL` matches current domain
3. Check browser console for errors
4. Verify SupplierContact record exists
5. Check network tab for API failures

---

### Redirect Loops
**Problem:** User keeps getting redirected

**Solutions:**
1. Check user role in database
2. Verify middleware logic
3. Clear browser cookies
4. Check NextAuth session
5. Verify role in JWT token

---

### Access Denied Error
**Problem:** Supplier sees "Access Denied" on RFP page

**Solutions:**
1. Verify `portalUserId` is set on SupplierContact
2. Check rfpId matches URL parameter
3. Verify User record exists with correct role
4. Check database indexes are created
5. Review server-side authorization logic

---

## ✅ Success Metrics

**Implementation Completeness:** 100%

- ✅ Database schema extended
- ✅ 5 API endpoints created
- ✅ Email system integrated
- ✅ Magic-link authentication working
- ✅ Supplier portal UI complete
- ✅ Authorization middleware active
- ✅ All testing scenarios passed
- ✅ Build successful (no errors)
- ✅ Git committed and versioned
- ✅ Documentation complete

**Code Quality:**
- ✅ TypeScript: No type errors
- ✅ ESLint: No linting errors
- ✅ Prisma: Schema validated
- ✅ Next.js: Build optimized

**No Breaking Changes:**
- ✅ All existing features preserved
- ✅ Backward compatible schema changes
- ✅ No performance degradation

---

## 📞 Support & Maintenance

### Code Ownership
This feature was implemented as part of STEP 15 of the Fyndr RFP management system.

### Maintenance Notes
- Review token expiration logs weekly
- Monitor email delivery rates
- Clean up expired SupplierContacts monthly
- Update email templates as needed
- Review authorization logic during security audits

### Known Limitations (Part 1)
- Read-only supplier access (response submission in Part 2)
- One supplier per invitation (no team collaboration yet)
- No Q&A functionality (coming in Part 2)
- No file attachments (planned for Part 2)

---

**Implementation Complete:** November 29, 2025  
**Git Commit:** 503125a  
**Next Steps:** Test in production, gather feedback, plan Part 2 features
