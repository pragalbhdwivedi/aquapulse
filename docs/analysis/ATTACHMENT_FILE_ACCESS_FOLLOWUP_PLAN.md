# Attachment File Access Follow-Up Plan

## Current state

This pass scopes only attachment metadata reads.

It does not add file-content or download authorization because no clearly shared file-content route was coupled into this bounded seam.

## Follow-up recommendation

The next attachment-specific follow-up should ensure any file-content or download route reuses the same parent-resource visibility decision as attachment metadata detail.

That follow-up should:

1. identify every file-content route or storage retrieval seam
2. require the same parent-resource resolver decision before returning bytes
3. use not found for out-of-scope reads in active auth mode
4. preserve local-safe broad behavior

## Why it remains separate

Keeping file-content authorization separate here avoids:

- accidental storage-path redesign
- coupling metadata filtering to storage behavior changes
- widening this pass beyond bounded attachment metadata reads
