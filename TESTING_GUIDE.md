# 🧪 Quick Testing Guide - Supplier Portal

## Prerequisites
```bash
# Start the development server
cd /home/ubuntu/fyndr/nextjs_space
npm run dev
```

**Note:** This localhost refers to localhost of the computer that I'm using to run the application, not your local machine. To access it locally or remotely, you'll need to deploy the application on your own system.

---

## Test Flow (5 Minutes)

### Step 1: Access Dashboard as Buyer
1. Open browser: `http://localhost:3000/login`
2. Login with existing account
3. Navigate to: `/dashboard/rfps`
4. Click on any RFP to open detail page

---

### Step 2: Invite a Supplier
1. Scroll to **"Supplier Contacts"** section
2. Click **"Invite Supplier"** button
3. Fill in the form:
   - **Name:** Test Supplier
   - **Email:** Your test email (you'll need to check this)
   - **Organization:** Test Corp (optional)
4. Click **"Send Invitation"**
5. ✅ Verify: Table shows new contact with blue "SENT" badge

---

### Step 3: Check Email Invitation
1. Open email inbox for the test email
2. Look for email with subject: "You've been invited to respond to an RFP: [RFP Title]"
3. Verify email contains:
   - ✅ Professional Fyndr branding
   - ✅ RFP title
   - ✅ Buyer company name
   - ✅ Timeline dates (if set on RFP)
   - ✅ "Access RFP Portal" button
   - ✅ Security notice (7-day expiration)

---

### Step 4: Test Magic-Link Login
1. Click **"Access RFP Portal"** button in email
2. You'll be redirected to: `/supplier/access?token=...`
3. Watch the flow:
   - ✅ "Validating access" spinner
   - ✅ "Access Granted!" success message
   - ✅ Auto-redirect to `/supplier/rfps/[id]`
4. Verify supplier portal view:
   - ✅ Header shows "Supplier Portal" purple badge
   - ✅ RFP title visible
   - ✅ "Read-Only Access" badge
   - ✅ All RFP details displayed
   - ✅ Timeline visible (if dates exist)
   - ✅ "Need Help?" section at bottom

---

### Step 5: Test Authorization
**While logged in as supplier:**

1. Try to access buyer dashboard:
   - Navigate to: `http://localhost:3000/dashboard`
   - ✅ Should redirect back to `/supplier`
   
2. Try to access another RFP:
   - Navigate to: `/supplier/rfps/[different-rfp-id]`
   - ✅ Should show "Access Denied" message

3. Sign out from supplier portal

---

### Step 6: Test Resend Invitation
1. Log back in as buyer
2. Go to RFP detail page
3. Find the supplier in the table
4. Click the **Send icon** (blue envelope)
5. ✅ Verify: New email sent to supplier
6. Check email for new invitation with fresh token

---

### Step 7: Test Delete Contact
1. Click **Trash icon** (red) next to supplier
2. Confirm deletion in browser alert
3. ✅ Verify: Contact removed from table
4. Try to use old magic link
5. ✅ Should show "Invalid or expired access link"

---

## Quick Validation Checklist

### Database ✅
```bash
# Check if tables exist
cd /home/ubuntu/fyndr/nextjs_space
npx prisma studio
```
Navigate to:
- ✅ `User` model → Check `role` field exists
- ✅ `SupplierContact` model → Check new table exists
- ✅ `RFP` model → Check `supplierContacts` relation

### API Endpoints ✅
Test with curl or Postman:

```bash
# List suppliers (must be authenticated)
curl http://localhost:3000/api/rfps/[rfp-id]/suppliers \
  -H "Cookie: next-auth.session-token=..."

# Expected: { "supplierContacts": [...] }
```

### Build Status ✅
```bash
npm run build
# Should complete with no errors
```

---

## Common Issues & Quick Fixes

### Issue: Email Not Received
**Check:**
1. Resend API key in `.env`
2. Spam/junk folder
3. Resend dashboard logs
4. Try resend button

### Issue: Token Expired
**Solution:**
- Tokens expire after 7 days
- Click "Resend" in buyer dashboard
- Use the new magic link

### Issue: Access Denied
**Check:**
1. Are you logged in as correct user?
2. Does `portalUserId` match your User ID?
3. Check database: `SupplierContact` record

### Issue: Redirect Loop
**Solution:**
1. Clear browser cookies
2. Check user `role` in database
3. Restart dev server

---

## Expected Behavior Summary

| Action | Expected Result |
|--------|----------------|
| Invite supplier | Email sent, status = SENT |
| Click magic link | Auto-login, redirect to RFP |
| Supplier views RFP | Read-only access, all details visible |
| Supplier tries /dashboard | Redirected to /supplier |
| Buyer tries /supplier/rfps | Redirected to /dashboard |
| Resend invitation | New token, new email |
| Delete contact | Record removed, old links invalid |
| Token expires | Error message, request new invite |

---

## Performance Checks ✅

- [ ] Email delivery < 3 seconds
- [ ] Magic-link validation < 500ms
- [ ] Supplier portal load < 1 second
- [ ] No console errors in browser
- [ ] No build warnings

---

## Next Steps After Testing

1. ✅ Verify all test scenarios pass
2. ✅ Review documentation in `SUPPLIER_PORTAL_IMPLEMENTATION.md`
3. ✅ Plan Part 2 features (response submission, Q&A)
4. ✅ Deploy to production
5. ✅ Monitor email delivery and login success rates

---

**Happy Testing! 🎉**

For detailed implementation info, see: `SUPPLIER_PORTAL_IMPLEMENTATION.md`
