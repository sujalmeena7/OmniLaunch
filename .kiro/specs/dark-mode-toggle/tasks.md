# Implementation Plan: Dark Mode Toggle

## Overview

This plan implements a dark/light mode toggle for the OmniLaunch dashboard. The approach is layered: first establish the CSS variable dark theme, then build the Zustand theme store with persistence, add the ThemeProvider with FOIT prevention, wire the toggle into the Sidebar, and finally add transition animations. Each step builds incrementally so the feature is testable at every stage.

## Tasks

- [x] 1. Set up testing infrastructure and CSS dark theme variables
  - [x] 1.1 Add Vitest testing framework and configure for React/TypeScript
    - Install `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom` as dev dependencies
    - Create `vitest.config.ts` with jsdom environment and path aliases matching `tsconfig.json`
    - Add `"test": "vitest --run"` script to `package.json`
    - _Requirements: Testing Strategy in design document_

  - [x] 1.2 Define dark theme CSS variable overrides in `globals.css`
    - Add `[data-theme="dark"]` selector block overriding all surface variables (`--bg-app`, `--bg-sidebar`, `--bg-surface`, `--bg-surface-hover`, `--bg-elevated`) with dark values (luminance below 20%)
    - Override text variables (`--text-primary`, `--text-secondary`, `--text-muted`) ensuring 4.5:1 contrast ratio against `--bg-surface` (3:1 for `--text-muted`)
    - Override border variables (`--border-subtle`, `--border-strong`) with 1.5:1 contrast against `--bg-surface`
    - Override shadow variables (`--shadow-sm`, `--shadow-md`, `--shadow-lg`) with rgba alpha >= 0.4
    - Add `dashboard-landing-bg` dark variant under `[data-theme="dark"]`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 5.6, 5.7_

- [x] 2. Implement Theme Store with persistence
  - [x] 2.1 Create `src/stores/themeStore.ts` with Zustand
    - Define `Theme` type as `"dark" | "light"`
    - Implement `ThemeState` interface with `theme`, `setTheme`, and `toggleTheme`
    - `setTheme` validates input — only accepts `"dark"` or `"light"`, ignores invalid values
    - `toggleTheme` flips between `"dark"` and `"light"`
    - Both actions persist to localStorage under key `"omnilaunch_theme"`
    - On store creation, read and validate localStorage value; default to `"light"` if invalid or missing
    - Wrap localStorage calls in try/catch for graceful error handling
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 6.1_

  - [ ]* 2.2 Write property test: setTheme validates input (Property 1)
    - **Property 1: setTheme validates input**
    - Generate arbitrary strings with `fast-check`; verify store only updates for `"dark"` or `"light"`
    - **Validates: Requirements 1.2, 1.3**
    - Test file: `src/stores/__tests__/themeStore.property.test.ts`

  - [ ]* 2.3 Write property test: toggleTheme is an involution (Property 2)
    - **Property 2: toggleTheme is an involution**
    - For any valid theme state, calling `toggleTheme()` twice returns to original value
    - **Validates: Requirements 1.4**
    - Test file: `src/stores/__tests__/themeStore.property.test.ts`

  - [ ]* 2.4 Write property test: Persistence round-trip (Property 3)
    - **Property 3: Persistence round-trip**
    - For any sequence of valid `setTheme`/`toggleTheme` operations, localStorage value always equals store's current `theme`
    - **Validates: Requirements 1.5, 6.1**
    - Test file: `src/stores/__tests__/themeStore.property.test.ts`

  - [ ]* 2.5 Write property test: Initialization validation (Property 4)
    - **Property 4: Initialization validation**
    - For any arbitrary string in localStorage, store initializes to that string only if it's `"dark"` or `"light"`, otherwise defaults to `"light"`
    - **Validates: Requirements 1.6, 2.3, 6.4**
    - Test file: `src/stores/__tests__/themeStore.property.test.ts`

  - [ ]* 2.6 Write unit tests for Theme Store
    - Test default theme is `"light"` when localStorage is empty
    - Test `setTheme("dark")` updates theme
    - Test `toggleTheme` switches correctly in both directions
    - Test store reads valid value from localStorage on init
    - Test file: `src/stores/__tests__/themeStore.test.ts`
    - _Requirements: 1.1, 1.2, 1.4, 1.6_

- [x] 3. Checkpoint - Verify store implementation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement ThemeProvider and FOIT prevention
  - [x] 4.1 Add inline blocking script to root layout (`src/app/layout.tsx`)
    - Insert `<script dangerouslySetInnerHTML>` in `<head>` that reads localStorage, validates value, falls back to `prefers-color-scheme`, then defaults to `"light"`
    - Script sets `data-theme` attribute on `<html>` and adds `no-transition` class
    - Ensure `suppressHydrationWarning` is on `<html>` element (already present)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 6.2, 6.3, 6.4, 6.5_

  - [x] 4.2 Create `src/components/ThemeProvider.tsx` client component
    - On mount: read localStorage → fall back to `prefers-color-scheme` → default to `"light"`
    - Sync resolved theme into Zustand themeStore via `setTheme`
    - Apply `data-theme` attribute to `document.documentElement`
    - Remove `no-transition` class after first paint using `requestAnimationFrame`
    - Subscribe to store changes and update `data-theme` attribute reactively
    - Handle localStorage errors gracefully (fall back to system preference)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 6.2, 6.3, 6.4, 6.5_

  - [x] 4.3 Integrate ThemeProvider into root layout
    - Import and wrap children with `<ThemeProvider>` in `src/app/layout.tsx`
    - _Requirements: 2.4, 2.5_

  - [ ]* 4.4 Write unit tests for ThemeProvider
    - Test applies `data-theme="dark"` when localStorage has `"dark"`
    - Test falls back to system preference when localStorage is empty
    - Test falls back to `"light"` when both localStorage and matchMedia unavailable
    - Test handles localStorage errors gracefully
    - Test file: `src/components/__tests__/ThemeProvider.test.tsx`
    - _Requirements: 2.1, 2.2, 2.3, 6.3, 6.5_

- [x] 5. Implement Toggle Button in Sidebar
  - [x] 5.1 Update `src/components/dashboard/Sidebar.tsx` with accessible theme toggle
    - Import `useThemeStore` and wire `toggleTheme` action to toggle button
    - Expanded state: render "Light" label, switch track with sliding circular indicator, "Dark" label
    - Collapsed state: render Moon icon (dark active) or Sun icon (light active)
    - Add `role="switch"`, `aria-checked={theme === "dark"}`, `aria-label="Toggle dark mode"`
    - Handle Enter and Space key presses to activate toggle
    - Position circular indicator left (light) or right (dark) based on current theme
    - Maintain visible top border separator from navigation items
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [ ]* 5.2 Write unit tests for Sidebar toggle
    - Test toggle renders with `role="switch"` and correct `aria-checked`
    - Test click toggles theme
    - Test Enter/Space key activates toggle
    - Test expanded sidebar shows labels; collapsed shows icon only
    - Test file: `src/components/dashboard/__tests__/Sidebar.toggle.test.tsx`
    - _Requirements: 4.2, 4.3, 4.4, 4.6, 4.7_

- [x] 6. Checkpoint - Verify toggle and provider integration
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Add transition animations and finalize dashboard component theming
  - [x] 7.1 Add CSS transition rules to `globals.css`
    - Add 200ms ease-out transition on `background-color` and `color` to `body`
    - Add 200ms ease-out transition on `background-color` and `border-color` for elements using `--bg-surface` and `--border-subtle`
    - Add `.no-transition` class that sets `transition: none !important` on all elements (`*, *::before, *::after`)
    - Ensure `no-transition` class prevents initial load animation
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 7.2 Update dashboard components to use CSS variables exclusively
    - Audit `Sidebar.tsx` — replace hardcoded `rgba(255, 255, 255, 0.4)` background with CSS variable reference
    - Ensure Sidebar uses dark semi-transparent background with backdrop blur >= 12px in dark mode
    - Ensure Header uses dark semi-transparent background with backdrop blur >= 12px in dark mode
    - Verify StatCard and QuickActionCard use CSS variable references for all colors
    - Remove any remaining hardcoded color literals from dashboard components
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.8_

- [x] 8. Final checkpoint - Full integration verification
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The project already has `fast-check` and `zustand` as dependencies
- Vitest needs to be added as the test runner (no test framework currently configured)
- All code is TypeScript/React (Next.js 16 with App Router)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "2.5", "2.6"] },
    { "id": 3, "tasks": ["4.1", "4.2"] },
    { "id": 4, "tasks": ["4.3", "4.4"] },
    { "id": 5, "tasks": ["5.1"] },
    { "id": 6, "tasks": ["5.2"] },
    { "id": 7, "tasks": ["7.1", "7.2"] }
  ]
}
```
