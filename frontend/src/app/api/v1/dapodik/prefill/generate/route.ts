import { NextResponse } from 'next/server';

/**
 * Fallback route untuk prefill/generate ketika Backend Rust tidak aktif.
 * Jika backend aktif, fetchApi() di dapodik-bridge.ts akan langsung
 * ke http://localhost:8000 dan route ini tidak dipanggil.
 */
export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error: {
        message:
          'Backend API Server (port 8000) tidak aktif. ' +
          'Jalankan backend terlebih dahulu dengan: cd backend && cargo run -p api-server. ' +
          'Generate prefill dari Kemendikdasmen memerlukan koneksi ke database School OS.',
      },
    },
    { status: 503 }
  );
}
