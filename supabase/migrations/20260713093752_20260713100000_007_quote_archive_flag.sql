/*
# Add archive flag to quote_requests

## Summary
Adds a non-destructive `is_archived` boolean flag to the `quote_requests` table so
administrators can archive quotes (hide them from the main view) without deleting them.
Archived quotes remain in the database and are fully recoverable.

## Changes

### Modified Tables
- `quote_requests`
  - New column: `is_archived` (boolean, NOT NULL, DEFAULT false)
    Marks a quote as archived — hidden from the default admin list view but preserved.

### New Indexes
- `idx_quote_requests_is_archived` on `quote_requests(is_archived)` for fast filtered queries.

## Security
No RLS changes required — existing admin write policies already cover UPDATE on this table.

## Notes
1. All existing rows default to `is_archived = false` (not archived).
2. Archiving is reversible; rows are never deleted by this mechanism.
3. The UI defaults to hiding archived quotes and shows them only in the "Archived" tab.
*/

ALTER TABLE quote_requests
  ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_quote_requests_is_archived
  ON quote_requests(is_archived);
