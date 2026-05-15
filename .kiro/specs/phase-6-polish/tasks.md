# Implementation Plan: Phase 6 Polish

## Overview

This plan transforms OmniLaunch from a functional prototype into a production-ready, monetizable product. Implementation proceeds in layers: foundational UI infrastructure (skeletons, toasts, error boundaries), then backend billing integration (Razorpay, webhooks, trial system), then responsive layout, and finally wiring everything together. Each layer builds on the previous, ensuring no orphaned code.

## Tasks

- [x] 1. Set up UI infrastructure — Skeleton, Toast, and Error Boundary components
  - [x] 1.1 Create the base Skeleton component and page-specific skeleton layouts
    - Create `components/ui/Skeleton.tsx` with shimmer animation using Tailwind `animate-pulse` and custom gradient
    - Create `DashboardSkeleton`, `BundlesSkeleton`, `VoiceLabSkeleton`, and `LaunchSkeleton` layout components
    - Integrate skeletons into Dashboard, Bundles, Voice Lab, and Launch pages to display while data is fetching
    - _Requirements: 1.1, 1.2, 1.3, 1.5_

  - [x] 1.2 Create the Toast notification system
    - Create `stores/toastStore.ts` using Zustand with `Toast` interface (id, type, message, duration, action)
    - Create `components/ui/Toast.tsx` and `ToastContainer.tsx` with fixed top-right positioning, stacking, and framer-motion enter/exit animations
    - Support three variants: success (green), error (red), warning (amber)
    - Auto-dismiss via `setTimeout` based on duration (3s success, 5s error)
    - Add dismiss button with fade-out animation
    - Mount `ToastContainer` in the root layout
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 1.3 Create Error Boundary components
    - Create `components/ui/ErrorBoundary.tsx` as a React class component with `componentDidCatch`
    - Implement `PageErrorBoundary` variant with inline fallback UI (error message + retry button)
    - Implement `RootErrorBoundary` variant with full-page fallback and reload link
    - Log caught errors with component stack trace to `console.error`
    - Wrap each dashboard page with `PageErrorBoundary` and the root layout with `RootErrorBoundary`
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 1.4 Create the Page Transition wrapper
    - Create `components/ui/PageTransition.tsx` using framer-motion `motion.div` with `AnimatePresence` and `key={pathname}`
    - Implement fade + translateY(8px) over 200ms with ease-out for route transitions
    - Add scale-up/fade-in for modal/overlay open and scale-down/fade-out for close
    - Add height + opacity transitions for list item add/remove
    - Integrate skeleton-to-content fade-in transition (150–300ms)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 1.4_

  - [ ]* 1.5 Write unit tests for Skeleton, Toast, and Error Boundary components
    - Test Skeleton renders correct placeholder elements for each page variant
    - Test Toast renders each variant with correct styling and auto-dismiss timing
    - Test Error Boundary catches errors and renders fallback with retry button
    - Test retry button resets error state and re-renders children
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2, 4.1, 4.3, 4.5_

- [ ] 2. Implement enhanced API client with retry logic and rate limit handling
  - [x] 2.1 Add retry logic and toast integration to the API client
    - Extend `lib/api.ts` with `requestWithRetry` method
    - Implement exponential backoff (500ms, 1000ms, 2000ms) for 5xx and network errors, max 3 retries
    - Do NOT retry 4xx errors (except 429 which gets special handling)
    - Integrate toast store: show error toasts on final failure, success toasts on mutations
    - On 429, parse `Retry-After` header and show toast with reset time
    - Show subtle loading indicator on affected component during retry
    - After all retries exhausted, show toast with manual retry action button
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 6.3_

  - [ ]* 2.2 Write property test for retry policy (Property 1)
    - **Property 1: Retry policy is determined by HTTP status code class**
    - Generate random HTTP status codes (400-599), verify 5xx triggers retry and 4xx does not
    - Verify network errors trigger retry
    - Verify 429 is not retried but gets special toast handling
    - **Validates: Requirements 5.1, 5.2**

  - [ ]* 2.3 Write property test for error toast on API failure (Property 10)
    - **Property 10: Error toast for any API failure**
    - Generate random error responses (4xx and 5xx after retries exhausted)
    - Verify toast system is triggered with error message from response body
    - **Validates: Requirements 4.1**

- [x] 3. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement quota display and rate limit feedback
  - [x] 4.1 Create the QuotaDisplay component
    - Create `components/dashboard/QuotaDisplay.tsx` showing `launches_remaining / launches_per_month`
    - Add progress bar visualization
    - Add warning state: display indicator when quota ≤ 1 (Free) or ≤ 5 (Pro); never for Team
    - Add "Upgrade" link when quota is exhausted; disable Generate Bundle button
    - Add trial badge showing "X days left in trial" when user is in trial period
    - Mount QuotaDisplay in the sidebar or header area
    - _Requirements: 6.1, 6.2, 6.4, 17.2_

  - [ ]* 4.2 Write property test for quota warning thresholds (Property 2)
    - **Property 2: Quota warning thresholds are plan-dependent**
    - Generate random (plan, quota) pairs across free/pro/team
    - Verify warning displays if and only if: (free AND quota ≤ 1) OR (pro AND quota ≤ 5)
    - Verify Team plan never shows warning
    - **Validates: Requirements 6.4**

  - [ ]* 4.3 Write property test for trial days remaining calculation (Property 8)
    - **Property 8: Trial days remaining calculation**
    - Generate random (now, trial_ends_at) pairs where trial_ends_at > now
    - Verify displayed days = ceil(difference in days)
    - **Validates: Requirements 17.2**

- [x] 5. Implement database migration for Razorpay
  - [x] 5.1 Create migration 003 for Razorpay schema changes
    - Create `supabase/migrations/003_razorpay.sql`
    - Rename `stripe_customer_id` → `razorpay_customer_id` in subscriptions table
    - Rename `stripe_subscription_id` → `razorpay_subscription_id` in subscriptions table
    - Add `razorpay_plan_id TEXT` column to subscriptions table
    - Add `trial_ends_at TIMESTAMPTZ` and `is_trial BOOLEAN DEFAULT false` columns to profiles table
    - Create `billing_events` table with RLS policy for user read access
    - Preserve all existing RLS policies on subscriptions table
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 17.1_

- [ ] 6. Implement Razorpay backend services and billing router
  - [x] 6.1 Update backend config and add Razorpay credentials
    - Update `backend/app/config.py` to replace Stripe fields with Razorpay equivalents
    - Add fields: `razorpay_key_id`, `razorpay_key_secret`, `razorpay_webhook_secret`, `razorpay_plan_id_pro_monthly`, `razorpay_plan_id_pro_yearly`, `razorpay_plan_id_team_monthly`, `razorpay_plan_id_team_yearly`
    - Update `.env.example` with new Razorpay environment variable placeholders
    - _Requirements: 10.1_

  - [x] 6.2 Create the Razorpay service
    - Create `backend/app/services/razorpay_service.py` wrapping the `razorpay` Python SDK
    - Implement `create_subscription(plan_id, customer_email)` → returns subscription dict
    - Implement `verify_payment_signature(payment_id, subscription_id, signature)` → bool using HMAC-SHA256
    - Implement `verify_webhook_signature(body, signature)` → bool using HMAC-SHA256 with `hmac.compare_digest`
    - Implement `cancel_subscription(subscription_id)` → dict
    - Implement `fetch_payments(customer_id)` → list of payment dicts
    - Add `razorpay` to `requirements.txt`
    - _Requirements: 10.2, 10.3, 10.4, 8.5_

  - [x] 6.3 Create the Trial service
    - Create `backend/app/services/trial_service.py`
    - Implement `assign_trial(user_id)` — sets `launches_remaining=10`, `trial_ends_at=now()+14d`, `is_trial=True`
    - Implement `check_trial_expiry(user_id)` → bool
    - Implement `expire_trial(user_id)` — resets to Free plan (3 launches), sets `is_trial=False`
    - Integrate trial assignment into user registration flow
    - _Requirements: 17.1, 17.3, 17.5_

  - [x] 6.4 Create the Billing router with all endpoints
    - Create `backend/app/routers/billing.py`
    - Implement `POST /api/v1/billing/create-subscription` — creates Razorpay subscription, returns subscription ID + key_id
    - Implement `POST /api/v1/billing/verify-payment` — verifies signature, activates subscription, updates plan and quota
    - Implement `POST /api/v1/billing/webhook` — processes webhook events (no auth, signature-verified)
    - Implement `GET /api/v1/billing/subscription` — returns current subscription details with quota usage
    - Implement `POST /api/v1/billing/cancel` — cancels active Razorpay subscription
    - Implement `GET /api/v1/billing/history` — returns payment history from billing_events table
    - Register router in `main.py`
    - _Requirements: 10.2, 10.3, 10.4, 10.5, 10.6, 18.3_

  - [x] 6.5 Implement webhook event handlers
    - Handle `subscription.activated` — update subscriptions table with Razorpay IDs, set plan tier, update quota
    - Handle `subscription.charged` — reset `launches_remaining` to plan allowance, update billing period dates
    - Handle `subscription.cancelled` — set status to "canceled", schedule downgrade to free at period end
    - Handle `payment.failed` — set status to "past_due", flag notification for user
    - Reject requests with invalid webhook signature (400 status), log the attempt
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ]* 6.6 Write property test for webhook signature verification (Property 3)
    - **Property 3: Webhook signature verification accepts valid signatures and rejects invalid ones**
    - Generate random payloads and secrets, compute HMAC-SHA256
    - Verify valid signatures pass and any modification to body/signature/secret causes failure
    - **Validates: Requirements 8.5, 8.6**

  - [ ]* 6.7 Write property test for plan ID to tier mapping (Property 4)
    - **Property 4: Subscription activation maps plan ID to correct tier and quota**
    - Generate plan IDs from the known set (pro_monthly, pro_yearly, team_monthly, team_yearly)
    - Verify correct tier assignment and quota (50 for pro, 999 for team)
    - **Validates: Requirements 8.1**

  - [ ]* 6.8 Write property test for quota reset on charge (Property 5)
    - **Property 5: Subscription charge resets quota to plan allowance**
    - Generate random pre-existing quota values and plan types
    - Verify `launches_remaining` is always reset to plan's `launches_per_month`
    - **Validates: Requirements 8.2**

  - [ ]* 6.9 Write property test for plan transition timing (Property 6)
    - **Property 6: Plan transition timing follows upgrade/downgrade rules**
    - Generate random (currentPlan, newPlan) pairs from free/pro/team
    - Verify upgrades apply at next billing cycle start, downgrades at current period end
    - **Validates: Requirements 9.3**

  - [ ]* 6.10 Write property test for trial assignment (Property 7)
    - **Property 7: Trial assignment gives correct quota and duration**
    - Generate random registration timestamps
    - Verify exactly 10 launches assigned and `trial_ends_at` = registration + 14 days
    - **Validates: Requirements 17.1**

- [x] 7. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement Razorpay billing UI components
  - [x] 8.1 Create billing frontend components
    - Create `components/billing/PlanSelector.tsx` — plan comparison cards with ₹499/mo Pro and ₹1,499/mo Team pricing
    - Create `components/billing/CheckoutButton.tsx` — lazy-loads Razorpay SDK, triggers checkout overlay pre-filled with user email
    - Create `components/billing/SubscriptionCard.tsx` — displays current plan, billing period end, quota usage (used/total)
    - Create `components/billing/BillingHistory.tsx` — table of past payments with date, amount (INR), plan, status, and receipt download links
    - Create `components/billing/TrialBanner.tsx` — prominent upgrade banner when trial < 3 days remaining
    - _Requirements: 7.1, 7.5, 9.1, 9.2, 17.4, 18.1, 18.2, 18.4_

  - [x] 8.2 Integrate billing components into Settings page
    - Add SubscriptionCard to Settings page showing current plan details
    - Add "Change Plan" button that displays PlanSelector
    - Add "Cancel Subscription" with confirmation dialog explaining downgrade timing
    - Add BillingHistory section below subscription management
    - Wire CheckoutButton to create subscription via backend and open Razorpay checkout
    - Handle checkout success: send verification data to backend, update UI on success
    - Handle checkout failure/dismiss: show toast "Payment was not completed"
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ]* 8.3 Write unit tests for billing UI components
    - Test PlanSelector renders correct pricing and plan comparison
    - Test CheckoutButton lazy-loads SDK and handles success/failure
    - Test SubscriptionCard displays correct plan info and quota
    - Test BillingHistory renders payment entries and handles empty state
    - Test TrialBanner appears only when trial < 3 days remaining
    - _Requirements: 7.1, 7.4, 9.1, 17.4, 18.1, 18.4_

- [ ] 9. Implement responsive mobile layout
  - [x] 9.1 Update Sidebar for mobile overlay mode
    - Modify `components/dashboard/Sidebar.tsx` to hide at ≤768px and show hamburger menu button in header
    - Implement slide-in overlay with backdrop on hamburger tap
    - Close sidebar on backdrop tap or navigation link tap
    - _Requirements: 11.1, 11.2, 11.3_

  - [x] 9.2 Update Header for compact mobile mode
    - Modify `components/dashboard/Header.tsx` for compact layout at ≤768px: hamburger button + page title + user avatar only
    - _Requirements: 11.5_

  - [x] 9.3 Update dashboard grids and cards for responsive breakpoints
    - Update StatCard grid: single column at ≤768px, two columns at 769–1024px, four columns at >1024px
    - Update Bundles page cards: single column with reduced padding at ≤768px
    - Reduce main content padding from 32px to 16px at ≤768px
    - _Requirements: 11.4, 12.1, 12.2, 12.3_

  - [x] 9.4 Update Launch workspace for mobile layout
    - Stack product form above preview panel vertically at ≤768px
    - Add tab switcher to toggle between "Input" and "Preview" views on mobile
    - Make platform tabs horizontally scrollable at ≤768px
    - Collapse validation gutter into expandable summary bar showing pass/warn/fail counts
    - _Requirements: 12.4, 13.1, 13.2, 13.3_

  - [ ]* 9.5 Write unit tests for responsive layout
    - Test Sidebar renders as overlay at mobile viewport
    - Test Header renders compact mode at mobile viewport
    - Test grid layouts change columns at breakpoints
    - Test Launch workspace stacks vertically at mobile
    - _Requirements: 11.1, 11.5, 12.1, 13.1_

- [ ] 10. Implement keyboard shortcuts
  - [x] 10.1 Create the Escape key handler system
    - Create `lib/useKeyboardShortcuts.ts` with `useEscapeHandler` hook managing a stack of escape handlers
    - Components register/unregister their escape handler on mount/unmount
    - Topmost handler fires on Escape press
    - Integrate with: modals, mobile sidebar, command palette
    - _Requirements: 14.1, 14.2, 14.3_

  - [ ]* 10.2 Write property test for escape key closes topmost overlay (Property 9)
    - **Property 9: Escape key closes topmost overlay**
    - Generate random overlay stack states (command palette, mobile sidebar, confirmation dialogs)
    - Verify only the topmost overlay is closed on Escape press
    - **Validates: Requirements 14.1, 14.2, 14.3**

- [ ] 11. Wire everything together and final integration
  - [x] 11.1 Integrate trial system with registration and quota display
    - Wire trial assignment into user registration flow (backend)
    - Display trial badge in QuotaDisplay when user is in trial
    - Show trial expiry banner when < 3 days remaining
    - Handle trial expiry: reset to Free plan on backend check
    - When user subscribes during trial, immediately transition to paid plan
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

  - [x] 11.2 Connect quota updates to launch generation flow
    - After successful bundle generation, decrement `launches_remaining` and update QuotaDisplay
    - When quota reaches zero, disable Generate Bundle button and show upgrade prompt
    - _Requirements: 6.1, 6.2_

  - [ ]* 11.3 Write integration tests for billing webhook flow
    - Test `subscription.activated` webhook updates plan and quota correctly
    - Test `subscription.charged` webhook resets quota
    - Test `subscription.cancelled` webhook schedules downgrade
    - Test `payment.failed` webhook sets past_due status
    - Test invalid signature returns 400
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ]* 11.4 Write integration tests for trial and billing endpoints
    - Test create-subscription endpoint returns subscription ID
    - Test verify-payment endpoint with valid/invalid signatures
    - Test billing history endpoint returns correct format
    - Test trial expiry logic with mocked time
    - _Requirements: 10.2, 10.3, 18.3, 17.3_

- [x] 12. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- Frontend uses TypeScript with Next.js, framer-motion, Tailwind CSS, and Zustand
- Backend uses Python with FastAPI and the `razorpay` SDK
- Database migrations target Supabase (PostgreSQL)
- Razorpay SDK is lazy-loaded on the frontend to minimize bundle size

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3", "5.1", "6.1"] },
    { "id": 1, "tasks": ["1.4", "1.5", "6.2", "6.3"] },
    { "id": 2, "tasks": ["2.1", "6.4", "6.5"] },
    { "id": 3, "tasks": ["2.2", "2.3", "4.1", "6.6", "6.7", "6.8", "6.9", "6.10"] },
    { "id": 4, "tasks": ["4.2", "4.3", "8.1", "9.1", "9.2", "10.1"] },
    { "id": 5, "tasks": ["8.2", "8.3", "9.3", "9.4", "9.5", "10.2"] },
    { "id": 6, "tasks": ["11.1", "11.2"] },
    { "id": 7, "tasks": ["11.3", "11.4"] }
  ]
}
```
