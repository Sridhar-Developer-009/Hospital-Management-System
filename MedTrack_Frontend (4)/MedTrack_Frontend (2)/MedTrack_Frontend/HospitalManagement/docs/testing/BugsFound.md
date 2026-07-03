# Bugs Found

| Bug ID | Feature | Severity | Description | Steps to Reproduce | Expected Result | Actual Result | Root Cause | Fix Applied | Verification Status |
|---|---|---|---|---|---|---|---|---|---|
| | | | | | | | | | |

## Bug Report Template

When a bug is found, fill in a new row with:

- **Bug ID**: BUG-001, BUG-002, etc.
- **Feature**: Module/Feature name
- **Severity**: Critical / Major / Minor / Cosmetic
- **Description**: Clear, concise bug description
- **Steps to Reproduce**: Numbered steps from initial state
- **Expected Result**: What should happen
- **Actual Result**: What actually happens (include exact console output)
- **Root Cause**: Code analysis of why the bug occurs
- **Fix Applied**: What code change was made
- **Verification Status**: Fixed / Verified / Reopened / Not Fixed

## Common Bug Categories to Watch For

1. **Validation Bypass**: Empty/whitespace input accepted when it should be rejected
2. **Crash/Exception**: Unhandled exception causes app to terminate
3. **Data Corruption**: Wrong data saved, duplicate entries, missing foreign keys
4. **Logic Error**: Wrong status transitions, incorrect business rule enforcement
5. **UI/Display**: Truncated text, misaligned tables, wrong colors
6. **Navigation**: Menu option goes to wrong screen, back doesn't work
7. **Performance**: Slow loading, infinite loop
8. **Security**: SQL injection, unauthorized access, password shown in plain text

## Console Output Capture

When reporting a bug, paste the relevant console output here:

```
[Paste exact console output here showing the bug]
```
