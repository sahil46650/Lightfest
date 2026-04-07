# Task Completion Checklist

When completing a task, follow this checklist:

## 1. Code Quality
- [ ] Run linter: `npm run lint`
- [ ] Fix any linting errors
- [ ] Ensure TypeScript compiles: `npm run build` (or check for type errors)

## 2. Testing (if applicable)
- [ ] Run relevant tests based on the area modified:
  - Booking flow: `npm run test:booking-flow`
  - Inventory: `npm run test:inventory`
  - Promo codes: `npm run test:promo`
  - Email: `npm run test:email`
- [ ] Or run all tests: `npm run test:all`

## 3. Database (if schema changed)
- [ ] Run migrations: `npx prisma migrate dev`
- [ ] Regenerate client: `npx prisma generate`
- [ ] Update seed data if needed: `npx prisma db seed`

## 4. Git Workflow
```bash
git status              # Check what changed
git add <files>         # Stage code changes
git commit -m "..."     # Commit with descriptive message
git push                # Push to remote
```

## 5. Beads Task Tracking
```bash
bd close <issue-id>     # Close completed issues
bd sync                 # Sync beads with git remote
```

## 6. Documentation
- [ ] Update CLAUDE.md if API or architecture changed
- [ ] Update relevant feature module docs if patterns changed

## Common Pitfalls to Avoid
- Don't commit `.env.local` or other sensitive files
- Don't commit `node_modules/` or `.next/`
- Ensure imports use `@/` path aliases
- Don't bypass TSCheckout API for cart/checkout logic
