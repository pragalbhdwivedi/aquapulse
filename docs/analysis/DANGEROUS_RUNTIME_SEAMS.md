# Dangerous Runtime Seams

## 1. Public AI History And Generation

Why dangerous:

- real persisted AI request/response logs now exist
- routes are still public at the backend

## 2. Public Audit API

Why dangerous:

- real persisted audit data now exists
- read access is not restricted

## 3. Alerts Partial Protection Inconsistency

Why dangerous:

- alerts list/detail/mutations are mostly protected
- but create/update/attach-explanation/views-list remain public
- this creates an uneven trust model for the same domain

## 4. Supporting Modules With No Backend Auth

Affected:

- attachments
- batches

Why dangerous:

- these modules look like normal product surfaces but have no meaningful backend authorization

## 5. Frontend “Protected” Layout Without Hard Blocking

Why dangerous:

- reviewers may assume route-level protection where none exists
- backend auth remains the only real protection boundary

## 6. No Ownership Checks

Why dangerous:

- any operator-level user can act broadly where routes are protected
- there is no assignee/owner/supervisor restriction

## 7. Diagnostics Protected Only By Authentication

Why dangerous:

- any authenticated bearer can access backend runtime diagnostics in Keycloak mode
- no operator/admin boundary exists there

## 8. Auth Forwarding Trust Assumptions

Affected seam:

- web local proxy and backend forwarding

Why dangerous:

- env token, cookie token, or direct auth header can all become forwarded backend auth
- this is intentional for local-safe development, but it is still a trust seam

## 9. Websocket Ticket Not Bound To Session Identity

Why dangerous:

- short TTL helps
- but tickets are not tied to a stronger identity binding model

## 10. Audit API Excluded From Interceptor Logging

Why dangerous:

- avoids recursion
- but means audit-sensitive route access is itself not fully represented in automatic interceptor output
