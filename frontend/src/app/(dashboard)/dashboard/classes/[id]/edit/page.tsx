'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function EditClassRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || '';

  useEffect(() => {
    if (id) {
      router.replace(`/dashboard/classes/${id}?edit=true`);
    } else {
      router.replace('/dashboard/classes');
    }
  }, [id, router]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--text-muted)' }}>
      <span>Membuka form modal edit rombel...</span>
    </div>
  );
}
