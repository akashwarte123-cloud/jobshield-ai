/**
 * Generates initials from a user's full name.
 *
 * Rules:
 * - "Rahul Ingle"       → "RI"
 * - "Akash"             → "A"
 * - "John Doe"          → "JD"
 * - "rahul kumar ingle" → "RI" (first + last)
 * - ""  / null / undef  → "U"
 *
 * Always returns at most 2 uppercase characters.
 */
export function getInitials(name?: string | null): string {
  if (!name || !name.trim()) return 'U';

  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0][0].toUpperCase();

  // First + last name initials
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Retrieves the authenticated user's first name (the first word of their full name)
 * from localStorage. Falls back to 'User' if unavailable.
 */
export function getUserFirstName(): string {
  try {
    const authStr = localStorage.getItem('js_logged_in_user');
    if (authStr) {
      const parsed = JSON.parse(authStr);
      const name = parsed?.user?.name;
      if (name && name.trim()) {
        return name.trim().split(/\s+/)[0];
      }
    }
  } catch {
    // Ignore parse errors
  }
  return 'User';
}

/**
 * Retrieves the authenticated user's full name from localStorage.
 * Falls back to 'User' if unavailable.
 */
export function getUserFullName(): string {
  try {
    const authStr = localStorage.getItem('js_logged_in_user');
    if (authStr) {
      const parsed = JSON.parse(authStr);
      const name = parsed?.user?.name;
      if (name && name.trim()) {
        return name.trim();
      }
    }
  } catch {
    // Ignore parse errors
  }
  return 'User';
}
