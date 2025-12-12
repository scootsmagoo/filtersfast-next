import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function LegacyGlobalSettingsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/settings');
  }, [router]);

  return (
    <div style={{ padding: '1rem' }}>
      <h1>Global Settings Moved</h1>
      <p>
        The global settings dashboard now lives at{' '}
        <a href="/admin/settings">/admin/settings</a>. Redirecting you automatically.
      </p>
    </div>
  );
}
