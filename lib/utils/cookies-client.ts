'use client';

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const encodedName = encodeURIComponent(name) + '=';
  const cookies = document.cookie ? document.cookie.split(';') : [];

  for (const rawCookie of cookies) {
    const cookie = rawCookie.trim();
    if (cookie.startsWith(encodedName)) {
      return decodeURIComponent(cookie.substring(encodedName.length));
    }
  }

  return null;
}

export function deleteCookie(name: string, path: string = '/'): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.cookie = `${encodeURIComponent(name)}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=${path}`;
}

