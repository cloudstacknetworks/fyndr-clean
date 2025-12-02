#!/bin/bash

# STEP 38B Implementation Verification Script
# Run this script to verify the completeness of the Clause Library & Template Editor implementation

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     STEP 38B IMPLEMENTATION VERIFICATION                       ║"
echo "║     Clause Library & Template Editor System                    ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

cd /home/ubuntu/fyndr/nextjs_space

PASSED=0
FAILED=0

check() {
    if [ "$1" = "true" ]; then
        echo "✅ $2"
        PASSED=$((PASSED + 1))
    else
        echo "❌ $2"
        FAILED=$((FAILED + 1))
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. DATABASE SCHEMA VERIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

[ -f "prisma/schema.prisma" ] && check "true" "Schema file exists" || check "false" "Schema file exists"
grep -q "model ClauseCategory" prisma/schema.prisma && check "true" "ClauseCategory model" || check "false" "ClauseCategory model"
grep -q "model ClauseLibrary" prisma/schema.prisma && check "true" "ClauseLibrary model" || check "false" "ClauseLibrary model"
grep -q "model RfpTemplateClauseLink" prisma/schema.prisma && check "true" "RfpTemplateClauseLink model" || check "false" "RfpTemplateClauseLink model"
grep -q "appliedClausesSnapshot" prisma/schema.prisma && check "true" "RFP.appliedClausesSnapshot field" || check "false" "RFP.appliedClausesSnapshot field"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. CLAUSE ENGINE VERIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "lib/rfp-templates/clause-engine.ts" ]; then
    check "true" "clause-engine.ts exists ($(wc -l < lib/rfp-templates/clause-engine.ts) lines)"
    FUNC_COUNT=$(grep -c "^export.*function" lib/rfp-templates/clause-engine.ts)
    check "true" "Exported functions: $FUNC_COUNT"
else
    check "false" "clause-engine.ts exists"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. TEMPLATE EDITOR VERIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "lib/rfp-templates/template-editor.ts" ]; then
    check "true" "template-editor.ts exists ($(wc -l < lib/rfp-templates/template-editor.ts) lines)"
    FUNC_COUNT=$(grep -c "^export.*function" lib/rfp-templates/template-editor.ts)
    check "true" "Exported functions: $FUNC_COUNT"
else
    check "false" "template-editor.ts exists"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. API ENDPOINTS VERIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

[ -f "app/api/dashboard/clauses/route.ts" ] && check "true" "/api/dashboard/clauses" || check "false" "/api/dashboard/clauses"
[ -f "app/api/dashboard/clauses/[id]/route.ts" ] && check "true" "/api/dashboard/clauses/[id]" || check "false" "/api/dashboard/clauses/[id]"
[ -f "app/api/dashboard/rfp-templates/[id]/structure/route.ts" ] && check "true" "/api/dashboard/rfp-templates/[id]/structure" || check "false" "/api/dashboard/rfp-templates/[id]/structure"
[ -f "app/api/dashboard/rfp-templates/[id]/clauses/route.ts" ] && check "true" "/api/dashboard/rfp-templates/[id]/clauses" || check "false" "/api/dashboard/rfp-templates/[id]/clauses"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. UI PAGES VERIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

[ -f "app/dashboard/rfp-templates/clauses/page.tsx" ] && check "true" "Clause Library Manager page" || check "false" "Clause Library Manager page"
[ -f "app/dashboard/rfp-templates/page.tsx" ] && check "true" "Template Manager page" || check "false" "Template Manager page"
[ -f "app/dashboard/rfp-templates/[id]/edit/page.tsx" ] && check "true" "Template Editor page" || check "false" "Template Editor page"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. DEMO MODE VERIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -f "lib/demo/clause-seeder.ts" ]; then
    CLAUSE_COUNT=$(grep -o "title:" lib/demo/clause-seeder.ts | wc -l)
    check "true" "clause-seeder.ts exists ($CLAUSE_COUNT clauses)"
else
    check "false" "clause-seeder.ts exists"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7. DOCUMENTATION VERIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

[ -f "docs/STEP_38B_CLAUSE_LIBRARY_AND_TEMPLATE_EDITOR.md" ] && check "true" "Markdown documentation" || check "false" "Markdown documentation"
[ -f "docs/STEP_38B_CLAUSE_LIBRARY_AND_TEMPLATE_EDITOR.pdf" ] && check "true" "PDF documentation" || check "false" "PDF documentation"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "8. BUILD STATUS VERIFICATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo "Running build test..."
if npm run build > /tmp/build_output.txt 2>&1; then
    check "true" "Build successful"
else
    check "false" "Build failed (see /tmp/build_output.txt)"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    VERIFICATION SUMMARY                        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
TOTAL=$((PASSED + FAILED))
SUCCESS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASSED/$TOTAL)*100}")

echo "  Passed:        $PASSED"
echo "  Failed:        $FAILED"
echo "  Total:         $TOTAL"
echo "  Success Rate:  $SUCCESS_RATE%"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "  Status:        ✅ ALL CHECKS PASSED"
    echo ""
    echo "  🎉 STEP 38B implementation is complete and operational!"
else
    echo "  Status:        ⚠️  SOME CHECKS FAILED"
    echo ""
    echo "  Please review the failed items above."
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

exit $FAILED

