# Requirements Document

## Introduction

This feature adds a dark/light mode toggle to the OmniLaunch dashboard. The application currently uses a dark-only theme defined via CSS custom properties in `globals.css`. This feature introduces a complete light theme, a toggle mechanism in the sidebar, persistence of user preference via localStorage, and respect for the operating system's color scheme preference on first visit.

## Glossary

- **Theme_Store**: The Zustand store slice responsible for managing the current theme state (dark or light) and providing actions to toggle or set the theme.
- **Theme_Provider**: The client-side React component that initializes the theme on mount, applies the correct CSS class to the document root, and prevents flash of incorrect theme (FOIT).
- **Toggle_Button**: The interactive UI control in the sidebar that allows the user to switch between dark and light modes.
- **CSS_Variable_System**: The set of CSS custom properties defined in `globals.css` that control colors, backgrounds, borders, and shadows across the application.
- **System_Preference**: The operating system's `prefers-color-scheme` media query value indicating the user's preferred color scheme.
- **Dashboard_Components**: All React components rendered within the dashboard layout, including Sidebar, Header, StatCard, QuickActionCard, LaunchRow, and EmptyLaunches.

## Requirements

### Requirement 1: Theme State Management

**User Story:** As a user, I want the application to track my theme preference in a centralized store, so that all components react to theme changes consistently.

#### Acceptance Criteria

1. THE Theme_Store SHALL expose a `theme` property with a value of either `"dark"` or `"light"`, defaulting to `"light"` when no persisted value exists in localStorage.
2. THE Theme_Store SHALL expose a `setTheme` action that accepts `"dark"` or `"light"` and updates the `theme` property.
3. IF the `setTheme` action is called with a value other than `"dark"` or `"light"`, THEN THE Theme_Store SHALL ignore the call and leave the `theme` property unchanged.
4. THE Theme_Store SHALL expose a `toggleTheme` action that switches the `theme` property from `"dark"` to `"light"` or from `"light"` to `"dark"`.
5. WHEN the `setTheme` or `toggleTheme` action is called, THE Theme_Store SHALL persist the new theme value to localStorage under the key `"omnilaunch_theme"`.
6. WHEN the Theme_Store is initialized, THE Theme_Store SHALL read the value stored under the `"omnilaunch_theme"` key in localStorage and set the `theme` property to that value if it is `"dark"` or `"light"`, otherwise default to `"light"`.

### Requirement 2: Theme Initialization and System Preference

**User Story:** As a first-time visitor, I want the app to respect my operating system's color scheme preference, so that the dashboard matches my system settings without manual configuration.

#### Acceptance Criteria

1. WHEN the application loads and no value exists in localStorage for `"omnilaunch_theme"`, THE Theme_Provider SHALL evaluate the `prefers-color-scheme` media query and set the theme to `"dark"` if the result is `dark`, or `"light"` otherwise.
2. WHEN the application loads and a value exists in localStorage for `"omnilaunch_theme"`, THE Theme_Provider SHALL use the stored value as the active theme.
3. IF the value stored in localStorage for `"omnilaunch_theme"` is not `"dark"` or `"light"`, THEN THE Theme_Provider SHALL discard the invalid value and determine the theme from the System_Preference as defined in criterion 1.
4. WHEN the theme is determined during initialization, THE Theme_Provider SHALL apply a `data-theme` attribute with the value `"dark"` or `"light"` to the `<html>` element.
5. THE Theme_Provider SHALL execute theme determination and apply the `data-theme` attribute via an inline blocking script in the `<head>` element so that the attribute is present before the browser renders any content.

### Requirement 3: Dark Theme CSS Variables

**User Story:** As a user, I want a complete dark color scheme, so that the dashboard is comfortable to use in low-light environments.

#### Acceptance Criteria

1. WHEN the `data-theme` attribute on the `<html>` element is `"dark"`, THE CSS_Variable_System SHALL override all surface variables (`--bg-app`, `--bg-sidebar`, `--bg-surface`, `--bg-surface-hover`, `--bg-elevated`) with values whose computed background luminance is below 20% relative luminance.
2. WHEN the `data-theme` attribute on the `<html>` element is `"dark"`, THE CSS_Variable_System SHALL override all text variables (`--text-primary`, `--text-secondary`, `--text-muted`) with values that achieve a minimum contrast ratio of 4.5:1 against the `--bg-surface` background.
3. WHEN the `data-theme` attribute on the `<html>` element is `"dark"`, THE CSS_Variable_System SHALL override all border variables (`--border-subtle`, `--border-strong`) with values that are visually distinguishable from the adjacent surface, achieving a minimum contrast ratio of 1.5:1 against `--bg-surface`.
4. WHEN the `data-theme` attribute on the `<html>` element is `"dark"`, THE CSS_Variable_System SHALL override shadow variables (`--shadow-sm`, `--shadow-md`, `--shadow-lg`) with values using higher opacity (minimum rgba alpha of 0.4) than the light theme equivalents to remain perceptible on dark surfaces.
5. THE CSS_Variable_System SHALL define the light theme values as the default in `:root` and the dark theme values under `[data-theme="dark"]`.
6. WHEN the `data-theme` attribute on the `<html>` element is `"dark"`, THE CSS_Variable_System SHALL override `--text-muted` with a value that achieves a minimum contrast ratio of 3:1 against `--bg-surface` to meet WCAG AA for large text and UI components.

### Requirement 4: Toggle Button in Sidebar

**User Story:** As a user, I want a visible toggle in the sidebar to switch between dark and light modes, so that I can change the theme at any time.

#### Acceptance Criteria

1. THE Toggle_Button SHALL be rendered below the navigation items in the Sidebar component, separated from the navigation by a visible top border.
2. WHEN the sidebar is expanded, THE Toggle_Button SHALL display the label "Light" on the left side, the label "Dark" on the right side, and a circular switch indicator between them.
3. WHEN the sidebar is collapsed, THE Toggle_Button SHALL display only a moon icon when dark mode is active or a sun icon when light mode is active, without text labels.
4. WHEN the user activates the Toggle_Button, THE Toggle_Button SHALL call the `toggleTheme` action on the Theme_Store to switch between dark and light modes.
5. THE Toggle_Button SHALL visually reflect the current theme state by positioning the circular switch indicator on the left side when light mode is active and on the right side when dark mode is active.
6. THE Toggle_Button SHALL have an accessible role of "switch" with an accessible label of "Toggle dark mode" and an `aria-checked` attribute reflecting whether dark mode is currently active.
7. WHEN the user presses the Enter or Space key while the Toggle_Button has focus, THE Toggle_Button SHALL activate the theme toggle identically to a click interaction.
8. WHEN the Sidebar component mounts and no persisted theme preference exists, THE Toggle_Button SHALL default to reflecting the dark mode state as active.

### Requirement 5: Dashboard Component Theming

**User Story:** As a user, I want all dashboard components to properly display in both dark and light modes, so that the interface remains readable and visually consistent regardless of theme.

#### Acceptance Criteria

1. WHEN the theme changes, THE Dashboard_Components SHALL update their appearance by inheriting values from the CSS_Variable_System within 300 milliseconds and without requiring a page reload.
2. THE Dashboard_Components SHALL use CSS custom properties for all color, background, and border values, containing zero hardcoded color literals (hex codes, named colors, or rgb/rgba values that are not assigned to a CSS custom property).
3. WHEN the theme is `"dark"`, THE Sidebar component SHALL use a dark semi-transparent background (opacity between 0.3 and 0.6 on a dark base) with a backdrop blur of at least 12px.
4. WHEN the theme is `"dark"`, THE Header component SHALL use a dark semi-transparent background (opacity between 0.3 and 0.6 on a dark base) with a backdrop blur of at least 12px.
5. WHEN the theme is `"dark"`, THE StatCard and QuickActionCard components SHALL use dark surface colors (lightness value at or below 25%) for backgrounds and light text (lightness value at or above 80%) for primary content text.
6. THE `dashboard-landing-bg` CSS class SHALL define both a light variant (active when `data-theme` attribute is absent or set to `"light"`) and a dark variant (active when `data-theme` attribute is set to `"dark"`).
7. WHEN the theme is `"dark"`, THE CSS_Variable_System SHALL define a `[data-theme="dark"]` selector that overrides all surface, text, and border custom properties used by Dashboard_Components, ensuring a minimum contrast ratio of 4.5:1 between text and its immediate background.
8. IF the `data-theme` attribute value is set to an unsupported value (neither `"light"` nor `"dark"`), THEN THE Dashboard_Components SHALL fall back to the light theme appearance.

### Requirement 6: Theme Persistence Across Sessions

**User Story:** As a returning user, I want my theme preference to be remembered, so that I do not have to re-select my preferred mode each time I visit.

#### Acceptance Criteria

1. WHEN the user selects a theme via the Toggle_Button, THE Theme_Store SHALL write the value `"dark"` or `"light"` to localStorage under the key `"omnilaunch_theme"`.
2. WHEN the application loads on a subsequent visit and localStorage key `"omnilaunch_theme"` contains the value `"dark"` or `"light"`, THE Theme_Provider SHALL set that value as the active theme by updating the Theme_Store and applying the corresponding `data-theme` attribute to the `<html>` element.
3. IF localStorage is unavailable or throws an error, THEN THE Theme_Provider SHALL fall back to the System_Preference value.
4. IF the value stored in localStorage key `"omnilaunch_theme"` is not exactly `"dark"` or `"light"`, THEN THE Theme_Provider SHALL discard the invalid value and fall back to the System_Preference value.
5. IF both localStorage and System_Preference are unavailable, THEN THE Theme_Provider SHALL default to `"light"` as the active theme.

### Requirement 7: Transition Animation

**User Story:** As a user, I want smooth visual transitions when switching themes, so that the change feels polished rather than jarring.

#### Acceptance Criteria

1. WHEN the theme changes, THE CSS_Variable_System SHALL apply a CSS transition of 200ms duration with ease-out timing to background-color and color properties on the `body` element.
2. THE CSS_Variable_System SHALL declare a CSS transition of 200ms duration with ease-out timing on background-color and border-color properties for all elements that reference `var(--bg-surface)` or `var(--border-subtle)` in their styles.
3. WHEN the page initially loads, THE CSS_Variable_System SHALL NOT trigger transition animations, so that the initial theme renders instantly without a visible fade.
4. IF the user toggles the theme multiple times within 200ms, THEN THE CSS_Variable_System SHALL cancel any in-progress transition and apply the latest theme values immediately at the start of a new 200ms transition.
