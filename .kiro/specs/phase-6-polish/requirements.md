# Requirements Document

## Introduction

Phase 6 Polish brings OmniLaunch to production readiness by adding UI animations and loading states, comprehensive error handling, user-facing rate limit feedback, Razorpay billing integration (replacing Stripe), responsive mobile design, and extended keyboard shortcuts. This phase transforms the functional prototype into a polished, monetizable product.

## Glossary

- **Dashboard**: The authenticated area of OmniLaunch containing the sidebar, header, and main content area
- **Skeleton_Loader**: A placeholder UI element with shimmer animation displayed while content is loading
- **Error_Boundary**: A React component that catches JavaScript errors in its child component tree and renders a fallback UI with retry capability
- **Toast_Notification**: A transient message overlay that appears briefly to inform the user of an event (success, error, or warning)
- **Rate_Limiter**: The backend middleware (slowapi) that restricts API request frequency per user
- **Razorpay_Checkout**: The Razorpay JavaScript SDK overlay that handles payment collection securely on the client side
- **Razorpay_Order**: A server-side payment order created before checkout, containing amount, currency (INR), and receipt ID; required by Razorpay before initiating client-side payment
- **Razorpay_Signature**: An HMAC-SHA256 hash computed using the Razorpay key secret, used to verify payment authenticity on the backend by comparing against `razorpay_payment_id|razorpay_subscription_id`
- **Razorpay_Plan**: A recurring billing plan created in the Razorpay dashboard with a fixed amount (in paise) and billing interval (monthly or yearly); referenced by plan ID when creating subscriptions
- **Razorpay_Test_Mode**: The development/testing environment using `rzp_test_*` credentials and dummy card numbers (e.g., 4111 1111 1111 1111); switching to live mode requires only changing `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` environment variables to `rzp_live_*` equivalents
- **Razorpay_Webhook**: An HTTP POST callback sent by Razorpay to the backend when a payment or subscription event occurs
- **Billing_Period**: The monthly cycle starting from the subscription activation date, reset on each anniversary; determines when Launch_Quota resets
- **Subscription**: A recurring billing agreement between a user and OmniLaunch managed through Razorpay
- **Plan**: One of three subscription tiers — Free (3 launches/month, ₹0), Pro (50 launches/month, ₹499/month or ₹4,999/year), or Team (unlimited launches/month, ₹1,499/month or ₹14,999/year)
- **Free_Trial**: A 14-day introductory period for new users with 10 launches, after which the account reverts to the Free plan (3 launches/month) unless a paid subscription is activated
- **Launch_Quota**: The number of launch bundle generations remaining for a user in the current billing period
- **Sidebar**: The left navigation panel containing links to Dashboard, Launch, Voice Lab, Bundles, and Settings
- **Command_Palette**: The ⌘K-triggered overlay for quick navigation and actions (already implemented)
- **Breakpoint_Mobile**: A viewport width of 768px or below
- **Breakpoint_Tablet**: A viewport width between 769px and 1024px

## Requirements

### Requirement 1: Loading Skeletons

**User Story:** As a user, I want to see animated placeholder content while data loads, so that the interface feels responsive and I know content is incoming.

#### Acceptance Criteria

1. WHILE the Dashboard page is fetching data, THE Skeleton_Loader SHALL display shimmer-animated placeholders matching the layout of StatCard, LaunchRow, and QuickActionCard components
2. WHILE the Bundles list page is fetching data, THE Skeleton_Loader SHALL display shimmer-animated placeholders matching the layout of bundle cards
3. WHILE the Voice Lab page is fetching voice profile data, THE Skeleton_Loader SHALL display shimmer-animated placeholders matching the voice profile card layout
4. WHEN data loading completes, THE Skeleton_Loader SHALL transition to the actual content with a fade-in animation lasting between 150ms and 300ms
5. WHILE the Launch workspace is fetching platform rules, THE Skeleton_Loader SHALL display shimmer-animated placeholders in the platform tabs area

### Requirement 2: Page Transitions

**User Story:** As a user, I want smooth transitions between pages and UI state changes, so that the application feels fluid and professional.

#### Acceptance Criteria

1. WHEN a user navigates between dashboard pages, THE Dashboard SHALL animate the main content area with a fade and slide transition lasting between 150ms and 250ms
2. WHEN a modal or overlay opens, THE Dashboard SHALL animate the element in with a scale-up and fade transition
3. WHEN a modal or overlay closes, THE Dashboard SHALL animate the element out with a scale-down and fade transition
4. WHEN a list item is added or removed, THE Dashboard SHALL animate the change with a height and opacity transition

### Requirement 3: Global Error Boundaries

**User Story:** As a user, I want to see a helpful error screen with a retry option when something goes wrong, so that I can recover without refreshing the entire page.

#### Acceptance Criteria

1. IF a JavaScript runtime error occurs in a dashboard page component, THEN THE Error_Boundary SHALL catch the error and render a fallback UI displaying an error message and a retry button
2. WHEN the user clicks the retry button on an Error_Boundary fallback, THE Error_Boundary SHALL reset its error state and re-render the child component tree
3. IF a JavaScript runtime error occurs in the root layout, THEN THE Error_Boundary SHALL render a full-page fallback with a link to reload the application
4. THE Error_Boundary SHALL log caught errors to the browser console with the component stack trace

### Requirement 4: Toast Notifications for API Errors

**User Story:** As a user, I want to see brief notification messages when API calls fail, so that I understand what went wrong without losing my current context.

#### Acceptance Criteria

1. WHEN an API request returns a 4xx or 5xx status code, THE Toast_Notification SHALL display an error message describing the failure for a duration of 5 seconds
2. WHEN an API request succeeds for a mutating operation (create, update, delete), THE Toast_Notification SHALL display a success message for a duration of 3 seconds
3. THE Toast_Notification SHALL render in a fixed position at the top-right corner of the viewport, stacking vertically when multiple toasts are active
4. WHEN the user clicks the dismiss button on a Toast_Notification, THE Toast_Notification SHALL immediately close with a fade-out animation
5. THE Toast_Notification SHALL support three visual variants: success (green), error (red), and warning (amber)

### Requirement 5: API Retry Logic

**User Story:** As a user, I want failed API requests to automatically retry before showing an error, so that transient network issues do not disrupt my workflow.

#### Acceptance Criteria

1. WHEN an API request fails with a 5xx status code or a network error, THE Dashboard SHALL automatically retry the request up to 3 times with exponential backoff (500ms, 1000ms, 2000ms) for a maximum total wait of 3.5 seconds
2. WHEN an API request fails with a 4xx status code (excluding 429), THE Dashboard SHALL NOT retry the request and SHALL immediately display the error via Toast_Notification
3. WHEN all retry attempts are exhausted, THE Dashboard SHALL display the error via Toast_Notification with a manual retry option
4. WHILE a retry is in progress, THE Dashboard SHALL display a subtle loading indicator on the affected component

### Requirement 6: User-Facing Rate Limit Feedback

**User Story:** As a user, I want to see how many launches I have remaining and receive clear feedback when I hit a rate limit, so that I can plan my usage accordingly.

#### Acceptance Criteria

1. THE Dashboard SHALL display the user's remaining Launch_Quota in the sidebar or header area, updating after each successful generation
2. WHEN the user's Launch_Quota reaches zero, THE Dashboard SHALL disable the Generate Bundle button and display a message indicating the quota is exhausted with an option to upgrade
3. WHEN an API request returns a 429 (Too Many Requests) status code, THE Toast_Notification SHALL display a rate limit message including the time until the limit resets
4. WHEN the user's Launch_Quota reaches 1 remaining (Free plan) or 5 remaining (Pro plan), THE Dashboard SHALL display a warning indicator near the quota display; Team plan users SHALL NOT see quota warnings

### Requirement 7: Razorpay Billing Integration — Checkout Flow

**User Story:** As a user, I want to subscribe to a paid plan using Razorpay, so that I can unlock more launches per month.

#### Acceptance Criteria

1. WHEN the user clicks "Upgrade to Pro" or "Upgrade to Team" on the Settings page, THE Dashboard SHALL create a Razorpay subscription via the backend and open the Razorpay_Checkout overlay pre-filled with the user's email
2. WHEN the Razorpay_Checkout payment succeeds, THE Dashboard SHALL send the payment verification data (razorpay_payment_id, razorpay_subscription_id, razorpay_signature) to the backend for server-side verification
3. WHEN the backend verifies the Razorpay signature successfully, THE Dashboard SHALL update the user's plan and Launch_Quota immediately in the UI
4. IF the Razorpay_Checkout is dismissed or payment fails, THEN THE Dashboard SHALL display a Toast_Notification informing the user that the payment was not completed
5. THE Dashboard SHALL load the Razorpay JavaScript SDK (checkout.js) only when the user initiates a payment action, not on initial page load

### Requirement 8: Razorpay Billing Integration — Webhook Handling

**User Story:** As a system operator, I want the backend to process Razorpay webhook events, so that subscription state stays synchronized regardless of client-side behavior.

#### Acceptance Criteria

1. WHEN a `subscription.activated` webhook event is received, THE Backend SHALL update the subscriptions table with the Razorpay subscription ID, set the plan to the corresponding tier, and update the user's Launch_Quota
2. WHEN a `subscription.charged` webhook event is received, THE Backend SHALL reset the user's Launch_Quota to the plan's monthly allowance and update the current billing period dates
3. WHEN a `subscription.cancelled` webhook event is received, THE Backend SHALL set the subscription status to "canceled" and downgrade the user's plan to "free" at the end of the current billing period
4. WHEN a `payment.failed` webhook event is received, THE Backend SHALL set the subscription status to "past_due" and send a notification (via the next API response) to the user
5. THE Backend SHALL verify the Razorpay webhook signature using the webhook secret before processing any event
6. IF the webhook signature verification fails, THEN THE Backend SHALL reject the request with a 400 status code and log the attempt

### Requirement 9: Razorpay Billing Integration — Subscription Management

**User Story:** As a user, I want to view, upgrade, downgrade, or cancel my subscription from the Settings page, so that I have full control over my billing.

#### Acceptance Criteria

1. THE Settings page SHALL display the user's current plan, billing period end date, and Launch_Quota usage (used/total)
2. WHEN the user clicks "Change Plan" on the Settings page, THE Dashboard SHALL display available plans with pricing and a comparison of features
3. WHEN the user selects a different plan, THE Backend SHALL update the Razorpay subscription; upgrades SHALL apply at the start of the next billing cycle and downgrades SHALL apply at the end of the current billing period
4. WHEN the user clicks "Cancel Subscription", THE Dashboard SHALL display a confirmation dialog explaining that the plan will revert to Free at the end of the current billing period
5. WHEN the user confirms cancellation, THE Backend SHALL cancel the Razorpay subscription and schedule the downgrade for the end of the current period

### Requirement 10: Razorpay Backend Configuration

**User Story:** As a developer, I want the backend to use Razorpay credentials instead of Stripe, so that the billing system integrates with the correct payment provider.

#### Acceptance Criteria

1. THE Backend SHALL replace Stripe configuration fields (stripe_secret_key, stripe_webhook_secret, stripe_price_pro, stripe_price_team) with Razorpay equivalents (razorpay_key_id, razorpay_key_secret, razorpay_webhook_secret, razorpay_plan_id_pro, razorpay_plan_id_team)
2. THE Backend SHALL expose a `POST /api/v1/billing/create-subscription` endpoint that creates a Razorpay subscription and returns the subscription ID for client-side checkout
3. THE Backend SHALL expose a `POST /api/v1/billing/verify-payment` endpoint that verifies the Razorpay payment signature and activates the subscription
4. THE Backend SHALL expose a `POST /api/v1/billing/webhook` endpoint that accepts Razorpay webhook events without authentication (verified by signature)
5. THE Backend SHALL expose a `GET /api/v1/billing/subscription` endpoint that returns the user's current subscription details including plan, status, and quota usage
6. THE Backend SHALL expose a `POST /api/v1/billing/cancel` endpoint that cancels the user's active Razorpay subscription

### Requirement 11: Responsive Dashboard — Mobile Layout

**User Story:** As a mobile user, I want to use OmniLaunch on my phone, so that I can review and manage my launches on the go.

#### Acceptance Criteria

1. WHILE the viewport width is at or below Breakpoint_Mobile, THE Sidebar SHALL be hidden by default and accessible via a hamburger menu button in the header
2. WHEN the user taps the hamburger menu button, THE Sidebar SHALL slide in from the left as an overlay with a backdrop
3. WHEN the user taps the backdrop or a navigation link in the mobile Sidebar, THE Sidebar SHALL slide out and close
4. WHILE the viewport width is at or below Breakpoint_Mobile, THE Dashboard main content padding SHALL reduce from 32px to 16px
5. WHILE the viewport width is at or below Breakpoint_Mobile, THE Header SHALL display a compact layout with the hamburger menu button, page title, and user avatar only

### Requirement 12: Responsive Dashboard — Cards and Grids

**User Story:** As a mobile user, I want dashboard cards and grids to reflow for smaller screens, so that content remains readable without horizontal scrolling.

#### Acceptance Criteria

1. WHILE the viewport width is at or below Breakpoint_Mobile, THE Dashboard stat cards grid SHALL display in a single column layout
2. WHILE the viewport width is between Breakpoint_Mobile and Breakpoint_Tablet, THE Dashboard stat cards grid SHALL display in a two-column layout
3. WHILE the viewport width is at or below Breakpoint_Mobile, THE Bundles page cards SHALL display in a single column with reduced padding
4. WHILE the viewport width is at or below Breakpoint_Mobile, THE Launch workspace SHALL stack the product form above the preview panel vertically instead of side-by-side

### Requirement 13: Responsive Dashboard — Launch Workspace Mobile

**User Story:** As a mobile user, I want to use the launch workspace on my phone, so that I can generate and review posts from any device.

#### Acceptance Criteria

1. WHILE the viewport width is at or below Breakpoint_Mobile, THE Launch workspace SHALL display the product form and preview panel in a vertically stacked layout with a tab switcher to toggle between "Input" and "Preview" views
2. WHILE the viewport width is at or below Breakpoint_Mobile, THE platform tabs in the preview panel SHALL be horizontally scrollable
3. WHILE the viewport width is at or below Breakpoint_Mobile, THE validation gutter SHALL collapse into an expandable summary bar showing pass/warn/fail counts

### Requirement 14: Keyboard Shortcuts — Modal and Navigation

**User Story:** As a power user, I want keyboard shortcuts for common actions, so that I can navigate and interact with the app efficiently.

#### Acceptance Criteria

1. WHEN the user presses the Escape key while a modal or overlay is open, THE Dashboard SHALL close the topmost modal or overlay
2. WHEN the user presses the Escape key while the mobile Sidebar is open, THE Sidebar SHALL close
3. WHEN the user presses the Escape key while the Command_Palette is open, THE Command_Palette SHALL close

*Note: Tab navigation ordering and visible focus indicators are deferred to a dedicated accessibility phase post-launch.*

### Requirement 15: Keyboard Shortcuts — Shortcut Hints (DEFERRED to v1.2)

*This requirement is deferred. The Command Palette already provides discoverability. Adding ⌘K badges everywhere adds visual clutter with low value.*

### Requirement 16: Database Migration for Razorpay

**User Story:** As a developer, I want the subscriptions table to use Razorpay identifiers instead of Stripe, so that the schema matches the payment provider.

#### Acceptance Criteria

1. THE Database migration SHALL rename the `stripe_customer_id` column to `razorpay_customer_id` in the subscriptions table
2. THE Database migration SHALL rename the `stripe_subscription_id` column to `razorpay_subscription_id` in the subscriptions table
3. THE Database migration SHALL add a `razorpay_plan_id` column to the subscriptions table to store the Razorpay plan identifier
4. THE Database migration SHALL preserve all existing row-level security policies on the subscriptions table

### Requirement 17: Free Trial

**User Story:** As a new user, I want a generous trial period to evaluate OmniLaunch, so that I can experience the full product before committing to a paid plan.

#### Acceptance Criteria

1. WHEN a new user registers, THE Backend SHALL assign 10 launches (instead of the standard 3) for the first 14 days as a trial period
2. THE Dashboard SHALL display "X days left in trial" in the header or sidebar area while the user is in the trial period
3. WHEN the 14-day trial period expires and no paid subscription is active, THE Backend SHALL reset the user's Launch_Quota to 3 launches per month (Free plan)
4. WHEN the trial period has fewer than 3 days remaining, THE Dashboard SHALL display a prominent banner encouraging the user to upgrade
5. IF the user subscribes to a paid plan during the trial, THEN THE Backend SHALL immediately transition the user to the paid plan and cancel the trial

### Requirement 18: Billing History

**User Story:** As a user, I want to view my past payments and download receipts, so that I can track my spending and maintain records for accounting.

#### Acceptance Criteria

1. THE Settings page SHALL display a "Billing History" section listing past payments with date, amount (in INR), plan name, and payment status
2. EACH billing history entry SHALL include a "Download Receipt" link that opens the Razorpay-hosted receipt URL in a new tab
3. THE Backend SHALL expose a `GET /api/v1/billing/history` endpoint that returns the user's payment history from Razorpay
4. IF the user has no payment history (Free plan, never subscribed), THEN THE Billing History section SHALL display a message indicating no payments have been made
