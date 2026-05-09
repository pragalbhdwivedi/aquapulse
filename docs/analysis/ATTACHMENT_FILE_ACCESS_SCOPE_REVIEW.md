# Attachment File Access Scope Review

## Current repo evidence

This audit did not find a dedicated attachment file-download or file-content route in the current repo.

What exists today is metadata-oriented attachment access:

- `GET /api/attachments`
- `GET /api/attachments/:id`

The surfaced attachment contract includes:

- `fileName`
- `mimeType`
- `sizeBytes`

It does not expose a separate content-fetch or signed-URL workflow in the current codebase.

## Security implication

Even though file-content access is not a separate route today, it should be treated as a future coupled authorization seam.

The rule should be:

- if an operator cannot see the attachment metadata, they must not be able to fetch the file
- if an operator can see attachment detail only through parent inheritance, file access must use that same inherited rule

## Why list/detail and file access must stay coupled

Decoupling these checks would create avoidable integrity gaps:

- metadata hidden but file still retrievable
- detail allowed but file blocked by a different guessed rule
- parent resource authorized in one path but ignored in another

## Safe future model

- attachment metadata list should inherit parent visibility
- attachment metadata detail should inherit parent visibility
- future file-content/download access should reuse the exact same parent authorization result

## Decision

No attachment file-access authorization should be implemented separately before parent-resource scope resolution exists.
