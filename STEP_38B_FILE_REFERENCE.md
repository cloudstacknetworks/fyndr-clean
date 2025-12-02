# STEP 38B File Reference Guide

Quick reference for all files created/modified in STEP 38B implementation.

## Core Implementation Files

### Backend Logic

| File | Lines | Description |
|------|-------|-------------|
| `lib/rfp-templates/clause-engine.ts` | 427 | Clause management: CRUD, linking, injection, snapshots |
| `lib/rfp-templates/template-editor.ts` | 533 | Template editing: structure management, versioning |
| `lib/demo/clause-seeder.ts` | 480 | Demo data: 40 clauses across 6 categories |

### Database Schema

| File | Lines | Description |
|------|-------|-------------|
| `prisma/schema.prisma` | 593 | Extended with ClauseCategory, ClauseLibrary, RfpTemplateClauseLink models |

### API Endpoints

| File | Lines | Endpoints | Description |
|------|-------|-----------|-------------|
| `app/api/dashboard/clauses/route.ts` | 106 | GET, POST | List and create clauses |
| `app/api/dashboard/clauses/[id]/route.ts` | 128 | GET, PUT, DELETE | Get, update, delete specific clause |
| `app/api/dashboard/rfp-templates/[id]/structure/route.ts` | 271 | GET, POST | Get and update template structure |
| `app/api/dashboard/rfp-templates/[id]/clauses/route.ts` | 150 | GET, POST | Get and manage template clause links |

### UI Components

| File | Lines | Route | Description |
|------|-------|-------|-------------|
| `app/dashboard/rfp-templates/clauses/page.tsx` | 739 | `/dashboard/rfp-templates/clauses` | Clause Library Manager |
| `app/dashboard/rfp-templates/page.tsx` | 338 | `/dashboard/rfp-templates` | Template Manager |
| `app/dashboard/rfp-templates/[id]/edit/page.tsx` | 813 | `/dashboard/rfp-templates/[id]/edit` | Template Editor |

### Documentation

| File | Size | Description |
|------|------|-------------|
| `docs/STEP_38B_CLAUSE_LIBRARY_AND_TEMPLATE_EDITOR.md` | 32 KB | Technical documentation (Markdown) |
| `docs/STEP_38B_CLAUSE_LIBRARY_AND_TEMPLATE_EDITOR.pdf` | 100 KB | Technical documentation (PDF) |

## Summary Statistics

- **Total Files:** 10 core implementation files
- **Total Lines:** 3,985 lines of code
- **Exported Functions:** 28 functions across clause-engine and template-editor
- **API Routes:** 4 endpoint groups (6 HTTP methods)
- **UI Pages:** 3 complete pages
- **Demo Clauses:** 40 clauses in 6 categories

## Key Functions Reference

### Clause Engine (`lib/rfp-templates/clause-engine.ts`)

```typescript
// Category Management
listClauseCategories(): Promise<ClauseCategory[]>
createClauseCategory(name, description, color, icon): Promise<ClauseCategory>

// Clause CRUD
listClauses(filters): Promise<ClauseLibraryItem[]>
getClauseById(clauseId): Promise<ClauseLibraryItem | null>
createClause(input): Promise<ClauseLibraryItem>
updateClause(clauseId, input): Promise<ClauseLibraryItem>
deleteClause(clauseId): Promise<void>

// Template Linking
linkClauseToTemplate(templateId, clauseId, position): Promise<void>
unlinkClauseFromTemplate(templateId, clauseId): Promise<void>
getTemplateClauses(templateId): Promise<TemplateClauseLink[]>

// Clause Injection
injectClausesIntoTemplate(templateId): Promise<TemplateStructure>
createClausesSnapshot(templateId): Promise<any>
applyTemplateWithClauses(templateId, rfpId): Promise<void>
```

### Template Editor (`lib/rfp-templates/template-editor.ts`)

```typescript
// Structure Management
getTemplateStructure(templateId): Promise<TemplateStructure>
saveTemplateStructure(templateId, structure): Promise<void>

// Section Operations
addSection(templateId, section): Promise<void>
updateSection(templateId, sectionId, data): Promise<void>
deleteSection(templateId, sectionId): Promise<void>

// Subsection Operations
addSubsection(templateId, sectionId, subsection): Promise<void>
updateSubsection(templateId, subsectionId, data): Promise<void>
deleteSubsection(templateId, subsectionId): Promise<void>

// Question Operations
addQuestion(templateId, subsectionId, question): Promise<void>
updateQuestion(templateId, questionId, data): Promise<void>
deleteQuestion(templateId, questionId): Promise<void>

// Template Management
updateTemplateMetadata(templateId, metadata): Promise<void>
lockTemplate(templateId): Promise<void>
unlockTemplate(templateId): Promise<void>
createTemplateVersion(templateId): Promise<void>
```

## Database Schema Changes

### New Models

```prisma
model ClauseCategory {
  id             String          @id @default(cuid())
  name           String
  description    String?
  color          String?
  icon           String?
  organizationId String
  clauses        ClauseLibrary[]
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt
}

model ClauseLibrary {
  id             String                   @id @default(cuid())
  title          String
  content        String
  categoryId     String
  tags           String[]
  isActive       Boolean                  @default(true)
  usageCount     Int                      @default(0)
  organizationId String
  createdById    String
  templateLinks  RfpTemplateClauseLink[]
  createdAt      DateTime                 @default(now())
  updatedAt      DateTime                 @updatedAt
}

model RfpTemplateClauseLink {
  id            String         @id @default(cuid())
  templateId    String
  clauseId      String
  position      Int
  sectionId     String?
  subsectionId  String?
  createdAt     DateTime       @default(now())
}
```

### Extended Models

```prisma
model RfpTemplate {
  // ... existing fields
  version             Int      @default(1)
  isEditable          Boolean  @default(true)
  lastEditedById      String?
  lastEditedBy        User?    @relation("TemplateEditor")
  sectionsJson        Json?
  clausesJson         Json?
  clauseLinks         RfpTemplateClauseLink[]
}

model RFP {
  // ... existing fields
  appliedClausesSnapshot Json?
}

model User {
  // ... existing fields
  editedTemplates RfpTemplate[] @relation("TemplateEditor")
}
```

## Usage Examples

### Creating a Clause

```typescript
import { createClause } from '@/lib/rfp-templates/clause-engine';

const clause = await createClause({
  title: "Data Encryption Requirements",
  content: "All data must be encrypted at rest and in transit...",
  categoryId: "security-category-id",
  tags: ["security", "encryption", "compliance"],
  organizationId: "org-123",
  createdById: "user-456"
});
```

### Linking Clause to Template

```typescript
import { linkClauseToTemplate } from '@/lib/rfp-templates/clause-engine';

await linkClauseToTemplate(
  "template-id",
  "clause-id",
  {
    position: 1,
    sectionId: "section-id",
    subsectionId: "subsection-id"
  }
);
```

### Updating Template Structure

```typescript
import { saveTemplateStructure } from '@/lib/rfp-templates/template-editor';

await saveTemplateStructure("template-id", {
  sections: [
    {
      id: "section-1",
      title: "Technical Requirements",
      order: 1,
      subsections: [...]
    }
  ]
});
```

### Applying Template with Clauses

```typescript
import { applyTemplateWithClauses } from '@/lib/rfp-templates/clause-engine';

await applyTemplateWithClauses("template-id", "rfp-id");
// Clauses are injected into RFP and snapshot is saved
```

## API Usage Examples

### List All Clauses

```bash
GET /api/dashboard/clauses?organizationId=org-123&categoryId=legal
```

### Create New Clause

```bash
POST /api/dashboard/clauses
Content-Type: application/json

{
  "title": "Liability Cap",
  "content": "Total liability shall not exceed...",
  "categoryId": "legal-category",
  "tags": ["legal", "liability"]
}
```

### Update Template Structure

```bash
POST /api/dashboard/rfp-templates/template-123/structure
Content-Type: application/json

{
  "sections": [...],
  "metadata": {...}
}
```

### Link Clause to Template

```bash
POST /api/dashboard/rfp-templates/template-123/clauses
Content-Type: application/json

{
  "action": "link",
  "clauseId": "clause-456",
  "position": 1,
  "sectionId": "section-789"
}
```

## Demo Data

The clause seeder (`lib/demo/clause-seeder.ts`) provides 40 pre-built clauses across 6 categories:

1. **Legal & Compliance** (8 clauses)
   - Data Protection, Audit Rights, Indemnification, Liability Caps, etc.

2. **Commercial Terms** (8 clauses)
   - Payment Terms, Price Adjustment, Renewal Terms, Early Termination, etc.

3. **Security & Privacy** (8 clauses)
   - Data Encryption, Access Controls, Incident Response, Background Checks, etc.

4. **Service Level Agreements** (8 clauses)
   - Uptime Guarantee, Response Times, Performance Metrics, Service Credits, etc.

5. **Intellectual Property** (4 clauses)
   - IP Ownership, License Grants, Work for Hire, Patent Indemnity

6. **General Terms** (4 clauses)
   - Confidentiality, Non-Solicitation, Force Majeure, Dispute Resolution

## Testing the Implementation

Run the verification script:

```bash
cd /home/ubuntu/fyndr
./verify_step38b.sh
```

This will check:
- Database schema completeness
- File existence and line counts
- Function exports
- API endpoint availability
- Build status

## Next Steps

1. **Testing:** Manual testing of UI workflows
2. **Integration:** Ensure clause injection works with RFP creation
3. **Performance:** Test with large clause libraries
4. **User Acceptance:** Gather feedback on editor UX
5. **Documentation:** Add user guides and video tutorials

---

**Implementation Status:** ✅ COMPLETE  
**Last Updated:** December 2, 2025  
**Version:** 1.0
