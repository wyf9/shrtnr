# TESTS.md

Test plan for shrtnr. Each item describes a behavior that should be verified.

---

## Redirect

- Accessing a valid, active slug should return a 301 redirect to the destination URL
- Accessing a slug that does not exist should return a 404 page
- Accessing a slug whose link has `expires_at` set to a past timestamp should return a 404 page
- Accessing a slug whose link has `expires_at` set to a future timestamp should redirect normally
- Accessing a slug whose link has `expires_at` set to null should redirect normally (no expiry)
- A redirect should record a click asynchronously without delaying the response
- A click record should capture referrer, country, device type, and browser when available
- A click record should handle missing referrer, country, or user-agent gracefully (null values)
- The slug's `click_count` should increment by 1 after each redirect

## Slug Generation

- A generated random slug should only contain characters from the unambiguous charset (no I, O, l, o, 0, 1)
- A generated random slug should match the requested length
- Slug generation should retry when a collision occurs (up to 10 attempts)
- Slug generation should throw after 10 consecutive collisions
- A random slug shorter than 3 characters should fail validation
- A random slug starting with an underscore should fail validation
- A random slug containing non-alphanumeric characters should fail validation
- A vanity slug of 1 character should pass validation
- A vanity slug with hyphens in the middle should pass validation
- A vanity slug starting or ending with a hyphen should fail validation
- A vanity slug starting with an underscore should fail validation
- A slug length below 3 should fail validation

## Link CRUD

- Creating a link with a valid URL should return the link with an auto-generated slug
- Creating a link with an invalid URL should return a 400 error
- Creating a link with a vanity slug should attach both the auto-generated and vanity slugs
- Creating a link with a duplicate vanity slug should return a 409 error
- Creating a link with an optional label should store the label
- Creating a link with an optional `expires_at` should store the expiry timestamp
- Fetching all links should return them sorted by `created_at` descending
- Fetching all links should include each link's slugs and total click count
- Fetching a single link by ID should return the link with slugs and click totals
- Fetching a non-existent link ID should return a 404 error
- Updating a link's URL should change the destination without affecting slugs
- Updating a link's label to null should clear the label
- Updating a link's `expires_at` to null should clear the expiry (re-enable)
- Updating a link's `expires_at` to a future timestamp should set a scheduled expiry

## Disable / Enable

- The disable endpoint should set `expires_at` to the current timestamp
- A disabled link should stop redirecting immediately (returns 404)
- Enabling a link (setting `expires_at` to null via PUT) should restore redirects
- Disabling a link that does not exist should return a 404 error
- Disabling a link that is already disabled should update `expires_at` to the new "now" value

## Vanity Slugs

- Adding a vanity slug to a link should create a new slug with `is_vanity = 1`
- Adding a vanity slug that already exists should return a 409 error
- Adding a vanity slug with invalid characters should return a 400 error
- Removing a vanity slug should delete it from the link
- Removing an auto-generated slug (is_vanity = 0) should fail (protected)
- Removing a vanity slug from a non-existent link should return a 404 error

## Analytics

- Click stats for a link with no clicks should return zeros and empty arrays
- Click stats should aggregate clicks across all slugs of a link
- Click stats should return the top 10 countries, referrers, and browsers
- Click stats should return clicks over time for the last 30 days
- Dashboard stats should return total links and total clicks
- Dashboard stats should return the 5 most recent links
- Dashboard stats should return the 5 most clicked links

## Settings

- Fetching settings should return the current `slug_default_length`
- Fetching settings should fall back to the environment variable if no DB setting exists
- Updating `slug_default_length` to a valid value (>= 3) should persist the change
- Updating `slug_default_length` to a value below 3 should return a 400 error
- New links created after changing the default length should use the updated length

## Authentication

- Requests to `/_/api/*` without a `Cf-Access-Jwt-Assertion` header should return 401
- Requests to `/_/admin` without a `Cf-Access-Jwt-Assertion` header should return 401
- A valid JWT should extract and lowercase the email claim
- A malformed JWT should return null (treated as unauthenticated)

## Routing

- `GET /` should redirect to `/_/admin`
- `GET /_/health` should return `{status: "ok"}` without requiring auth
- `GET /_/admin` should return the admin HTML when authenticated
- Paths starting with `_` that are not recognized routes should return a 404
- `/favicon.ico` should return the icon with `image/x-icon` content type
- `/apple-touch-icon.png` should return the icon with `image/png` content type

## User-Agent Parsing

- A Mobile Safari user-agent should be detected as "mobile" device and "Safari" browser
- A Chrome desktop user-agent should be detected as "desktop" device and "Chrome" browser
- An iPad user-agent should be detected as "tablet" device
- An empty or missing user-agent should default to "desktop" and "Other"
- Edge user-agent should be detected as "Edge" (not "Chrome")

## 404 Page

- The 404 response should have status code 404
- The 404 response should have `text/html` content type

## Admin UI Behavior

- The links list should hide disabled links by default
- The vanity URL can only be created once and not changed after.
- Requesting to "shorten" a URL that already exists in the database should return the existing link. 
- Toggling "Show disabled" should include expired links in the list
- Disabled links in the list should display a "Disabled" badge
- Sorting by "Recent" should order links by `created_at` descending
- Sorting by "Popular" should order links by total clicks descending
- Pagination should default to 25 links per page
- Changing per-page to 50 or 100 should adjust the displayed count
- The expiry Save button should be disabled when the date input is empty (if it was previously empty)
- The expiry Save button should be enabled if the date input field was previously having an expiry date (changed to be "cleared")
- The expiry Save button should enable when a valid date is entered or when the date input is cleared
- The expiry Clear button should be disabled when no expiry date is set on the link
- The expiry Clear button should be enabled when the link has an expiry date
- Clicking Clear should clear the input field, but not save any changes to database
- The Disable button should set `expires_at` to "now", save to database and refresh the detail view
- The Enable button should clear `expires_at`, save to database and refresh the detail view
- Creating a link should navigate to its detail page
- Clicking a slug chip should copy the full short URL to the clipboard
