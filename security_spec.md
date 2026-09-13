# Security Specification & Threat Model for Firestore

## 1. Data Invariants
1. All private resources (emails, crm_leads, templates, signatures, auto_rules, businesses, accounts) belong strictly to the authenticated user under `/users/{userId}/...`.
2. A user can ONLY read, write, update, or delete subcollection documents if `request.auth != null && request.auth.uid == userId`.
3. Unauthenticated requests (`request.auth == null`) must be unconditionally denied across all collections.
4. Cross-user data access is strictly blocked: User A cannot read or modify User B's mailbox, leads, signatures, templates, or business entities.
5. All document IDs must satisfy `isValidId(id)` (alphanumeric, dashes, underscores, max 128 characters).
6. Field values must respect maximum length boundaries and declared types to prevent denial-of-wallet resource inflation attacks.
7. Any document creation requires authentication verification (`request.auth.token.email_verified == true`).

## 2. The "Dirty Dozen" Payloads (Must Return PERMISSION_DENIED)
1. **Unauthenticated Read**: Attempting to read `/users/{userId}/emails/{emailId}` with `request.auth == null`.
2. **Cross-Tenant Impersonation**: Authenticated User A (`uid_attacker`) reading `/users/uid_victim/emails/email_1`.
3. **Cross-Tenant Injection**: Authenticated User A (`uid_attacker`) creating a lead in `/users/uid_victim/crm_leads/lead_1`.
4. **ID Poisoning / Path Traversal**: Attempting to write to `/users/{userId}/emails/..%2F..%2Fjunk` with an ID containing malicious symbols or exceeding 128 characters.
5. **PII Exfiltration**: Attempting to list all users from `/users` as an unprivileged or mismatched user.
6. **Payload Inflation Attack**: Writing an email document with `subject` exceeding 500 characters.
7. **Type Poisoning**: Writing a numeric `dealValue` as a string or array in `crm_leads`.
8. **Catch-All Probe**: Attempting to read or write to an undefined collection `/{document=**}` like `/system_config`.
9. **Unverified Email Bypass**: Attempting writes with `request.auth.token.email_verified == false`.
10. **Ghost Field / Shadow Field Injection**: Writing unexpected fields outside the schema blueprint into `userProfile`.
11. **Direct Modification of Foreign Account**: Modifying account configuration belonging to another user.
12. **Malicious Automation Escalation**: Injecting an executable script or oversized payload into `auto_rules/{ruleId}`.

## 3. Test Runner Reference
All 12 vector attempts must be blocked and return `PERMISSION_DENIED` by `firestore.rules`.
