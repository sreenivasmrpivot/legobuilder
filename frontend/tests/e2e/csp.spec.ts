/**
 * NFR-SEC-002: Content Security Policy — Playwright E2E Audit Tests
 *
 * Test IDs: T-SEC-002-01 through T-SEC-002-06
 * FR-ID: NFR-SEC-002
 * Issue: #31
 *
 * These tests validate that the LegoBuilder SPA is served with a strict
 * Content Security Policy header and that no inline scripts or eval()
 * calls are present in the production build.
 *
 * NOTE: These tests are designed to run against the production Nginx
 * container (docker-compose up --build). They intercept HTTP responses
 * to inspect headers and scan the page source / JS bundles.
 *
 * Spectra-Agent: frontend-test
 * Spectra-FRs: NFR-SEC-002
 * Spectra-Tests: T-SEC-002-01, T-SEC-002-02, T-SEC-002-03, T-SEC-002-04, T-SEC-002-05, T-SEC-002-06
 */

import { test, expect, type Page, type Response } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Navigate to the app root and capture the initial HTML response.
 * Returns the response so callers can inspect headers.
 */
async function navigateAndCapture(page: Page): Promise<Response> {
  let rootResponse: Response | null = null;

  page.on('response', (response) => {
    if (
      response.url().endsWith('/') ||
      response.url().endsWith('/index.html') ||
      response.url() === page.url()
    ) {
      rootResponse = response;
    }
  });

  const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
  return response ?? (rootResponse as unknown as Response);
}

/**
 * Collect all CSP violation events fired on the page.
 * Returns an array of SecurityPolicyViolationEvent-like objects.
 */
async function collectCspViolations(
  page: Page,
): Promise<{ blockedURI: string; violatedDirective: string; originalPolicy: string }[]> {
  const violations: { blockedURI: string; violatedDirective: string; originalPolicy: string }[] = [];

  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) => {
      // @ts-ignore — injected into browser context
      (window as any).__cspViolations = (window as any).__cspViolations || [];
      // @ts-ignore
      (window as any).__cspViolations.push({
        blockedURI: e.blockedURI,
        violatedDirective: e.violatedDirective,
        originalPolicy: e.originalPolicy,
      });
    });
  });

  await page.goto('/', { waitUntil: 'networkidle' });

  const raw = await page.evaluate(() => (window as any).__cspViolations ?? []);
  return raw as typeof violations;
}

// ---------------------------------------------------------------------------
// T-SEC-002-01: CSP header is present on the root HTML response
// ---------------------------------------------------------------------------
test('T-SEC-002-01: Content-Security-Policy header is present on root response', async ({ page }) => {
  const response = await page.goto('/', { waitUntil: 'domcontentloaded' });

  expect(response, 'Root page must return a response').not.toBeNull();

  const cspHeader =
    response!.headers()['content-security-policy'] ??
    response!.headers()['Content-Security-Policy'];

  expect(
    cspHeader,
    'Content-Security-Policy header must be present. ' +
      'Ensure nginx.conf includes the add_header Content-Security-Policy directive.',
  ).toBeTruthy();

  // The header must be a non-empty string
  expect(typeof cspHeader).toBe('string');
  expect(cspHeader.length).toBeGreaterThan(0);
});

// ---------------------------------------------------------------------------
// T-SEC-002-02: CSP header contains required directives
// ---------------------------------------------------------------------------
test('T-SEC-002-02: CSP header contains required directives', async ({ page }) => {
  const response = await page.goto('/', { waitUntil: 'domcontentloaded' });

  expect(response).not.toBeNull();

  const cspHeader: string =
    (response!.headers()['content-security-policy'] ??
      response!.headers()['Content-Security-Policy'] ??
      '') as string;

  expect(cspHeader, 'CSP header must be present').toBeTruthy();

  // Required directives per NFR-SEC-002 LLD Section 4
  const requiredDirectives: { directive: string; description: string }[] = [
    { directive: "default-src 'self'", description: 'default-src must be self' },
    { directive: "script-src 'self'", description: 'script-src must be self (no unsafe-eval, no unsafe-inline)' },
    { directive: 'connect-src', description: 'connect-src must be present' },
    { directive: 'img-src', description: 'img-src must be present' },
    { directive: 'font-src', description: 'font-src must be present' },
    { directive: 'object-src', description: "object-src must be present (expected 'none')" },
    { directive: 'frame-ancestors', description: "frame-ancestors must be present (expected 'none')" },
    { directive: 'base-uri', description: "base-uri must be present (expected 'self')" },
    { directive: 'form-action', description: "form-action must be present (expected 'self')" },
  ];

  for (const { directive, description } of requiredDirectives) {
    expect(
      cspHeader.toLowerCase(),
      `CSP header missing directive: ${description}`,
    ).toContain(directive.toLowerCase());
  }
});

// ---------------------------------------------------------------------------
// T-SEC-002-03: script-src does NOT contain unsafe-eval or unsafe-inline
// ---------------------------------------------------------------------------
test('T-SEC-002-03: script-src does not contain unsafe-eval or unsafe-inline in production', async ({ page }) => {
  const response = await page.goto('/', { waitUntil: 'domcontentloaded' });

  expect(response).not.toBeNull();

  const cspHeader: string =
    (response!.headers()['content-security-policy'] ??
      response!.headers()['Content-Security-Policy'] ??
      '') as string;

  expect(cspHeader, 'CSP header must be present').toBeTruthy();

  // Parse the script-src directive
  const directives = cspHeader.split(';').map((d) => d.trim());
  const scriptSrc = directives.find((d) => d.toLowerCase().startsWith('script-src'));

  expect(
    scriptSrc,
    'script-src directive must be present in CSP header',
  ).toBeTruthy();

  expect(
    scriptSrc!.toLowerCase(),
    "script-src must NOT contain 'unsafe-eval' in production",
  ).not.toContain("'unsafe-eval'");

  expect(
    scriptSrc!.toLowerCase(),
    "script-src must NOT contain 'unsafe-inline' in production",
  ).not.toContain("'unsafe-inline'");
});

// ---------------------------------------------------------------------------
// T-SEC-002-04: No inline <script> tags in the served HTML
// ---------------------------------------------------------------------------
test('T-SEC-002-04: No inline script tags present in the served HTML', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });

  // Collect all <script> elements that have inline content
  const inlineScripts = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script'));
    return scripts
      .filter((s) => {
        // An inline script has textContent but no src attribute
        const hasInlineContent = (s.textContent ?? '').trim().length > 0;
        const hasSrc = s.hasAttribute('src');
        return hasInlineContent && !hasSrc;
      })
      .map((s) => (s.textContent ?? '').trim().substring(0, 100));
  });

  expect(
    inlineScripts,
    `Found ${inlineScripts.length} inline <script> tag(s). ` +
      'All scripts must be external (src attribute). ' +
      `Inline content snippets: ${JSON.stringify(inlineScripts)}`,
  ).toHaveLength(0);
});

// ---------------------------------------------------------------------------
// T-SEC-002-05: No eval() calls detected in bundled JavaScript
// ---------------------------------------------------------------------------
test('T-SEC-002-05: No eval() calls in bundled JavaScript assets', async ({ page }) => {
  const jsResponses: { url: string; body: string }[] = [];

  // Intercept all JS responses
  page.on('response', async (response) => {
    const url = response.url();
    const contentType = response.headers()['content-type'] ?? '';
    if (
      contentType.includes('javascript') ||
      url.endsWith('.js') ||
      url.includes('/assets/')
    ) {
      try {
        const body = await response.text();
        jsResponses.push({ url, body });
      } catch {
        // Ignore responses that can't be read as text
      }
    }
  });

  await page.goto('/', { waitUntil: 'networkidle' });

  // Patterns that indicate eval() usage
  // We exclude eval-like patterns that are part of string literals or comments
  const evalPatterns = [
    /\beval\s*\(/,          // eval(
    /new\s+Function\s*\(/, // new Function(
    /setTimeout\s*\(\s*['"]/, // setTimeout("string"
    /setInterval\s*\(\s*['"]/, // setInterval("string"
  ];

  const violations: { url: string; pattern: string; snippet: string }[] = [];

  for (const { url, body } of jsResponses) {
    for (const pattern of evalPatterns) {
      const match = body.match(pattern);
      if (match) {
        const idx = body.indexOf(match[0]);
        const snippet = body.substring(Math.max(0, idx - 20), idx + 60);
        violations.push({ url, pattern: pattern.toString(), snippet });
      }
    }
  }

  expect(
    violations,
    `Found eval() usage in ${violations.length} JS asset(s). ` +
      'ESLint no-eval rules should have caught these at build time. ' +
      `Violations: ${JSON.stringify(violations, null, 2)}`,
  ).toHaveLength(0);
});

// ---------------------------------------------------------------------------
// T-SEC-002-06: Zero CSP violations reported at runtime
// ---------------------------------------------------------------------------
test('T-SEC-002-06: Zero CSP violations reported at runtime during normal app usage', async ({ page }) => {
  const violations = await collectCspViolations(page);

  // Allow a brief moment for any deferred violations to fire
  await page.waitForTimeout(2000);

  const finalViolations = await page.evaluate(() => (window as any).__cspViolations ?? []);

  expect(
    finalViolations,
    `Found ${finalViolations.length} CSP violation(s) at runtime. ` +
      'All resources must comply with the Content-Security-Policy. ' +
      `Violations: ${JSON.stringify(finalViolations, null, 2)}`,
  ).toHaveLength(0);
});
