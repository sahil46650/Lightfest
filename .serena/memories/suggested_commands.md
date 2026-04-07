# Suggested Commands

## Development
```bash
npm run dev                    # Start dev server at localhost:3000
npm run lint                   # ESLint check
```

## Build & Production
```bash
npm run build                  # Production build
npm start                      # Start production server
```

## Database (Prisma)
```bash
npx prisma migrate dev         # Run migrations in development
npx prisma db push             # Push schema changes (no migration)
npx prisma db seed             # Seed database
npx prisma studio              # Open Prisma Studio GUI
npx prisma generate            # Regenerate Prisma Client
```

## Testing
```bash
npm run test:booking-flow      # End-to-end booking flow
npm run test:inventory         # Inventory management
npm run test:promo             # Promo code functionality
npm run test:email             # Email queue validation
npm run test:cleanup           # Cleanup validation
npm run test:all               # Run all tests
npm run test:stress            # Concurrent bookings stress test
```

## Git Operations
```bash
git status                     # Check repository status
git add <files>                # Stage changes
git commit -m "message"        # Commit changes
git push                       # Push to remote
git pull                       # Pull from remote
```

## Beads (Task Tracking)
```bash
bd ready                       # Find tasks ready to work
bd list --status=open          # All open issues
bd create --title="..." --type=task --priority=2  # Create issue
bd update <id> --status=in_progress  # Claim work
bd close <id>                  # Mark complete
bd sync                        # Sync with git remote
```

## File System (macOS/Darwin)
```bash
ls -la                         # List files with details
find . -name "*.ts"            # Find files by pattern
grep -r "pattern" .            # Search in files
```
