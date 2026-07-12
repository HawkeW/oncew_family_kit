# Context

Family health kit — a Nuxt 3 application for managing personal and family health records.

## Domain

- **Users**: authenticated users who can create and share records
- **Groups**: family/group sharing units with members and roles (admin/member)
- **Records**: health-related records (menstrual, stool, etc.) that can be personal or shared within a group
- **Record Types**: customizable record types with dynamic fields
- **Record Categories**: groupings for record types

## Architecture

- Frontend: Nuxt 3 + Vue 3 + TypeScript + Tailwind CSS + shadcn-vue
- Backend: Nitro server routes
- Database: SQLite via better-sqlite3
- Auth: Session-based authentication

## Key Decisions

See `docs/adr/` for Architecture Decision Records.
