# Demo

Run the demo from the repository root:

```bash
npm run demo
```

The demo has three steps:

1. Validate a broken recovery fixture. ACH rejects it because a required state
   file is missing.
2. Validate a complete formal state root. ACH accepts it as a recovery source.
3. Generate a handoff from that formal state instead of relying on chat memory.

This is the smallest product proof: ACH does not make the model smarter; it
makes the task state recoverable when the conversation no longer carries enough
reliable context.

