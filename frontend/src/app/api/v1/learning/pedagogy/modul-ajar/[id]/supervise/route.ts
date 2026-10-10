import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      status, // 'ACTIVE', 'APPROVED', 'REVISION_REQUIRED', 'SUSPENDED'
      notes,
      supervisor_id,
      supervisor_name = 'Kepala Sekolah',
    } = body;

    const validStatuses = ['ACTIVE', 'APPROVED', 'REVISION_REQUIRED', 'SUSPENDED', 'DRAFT'];
    const targetStatus = (status || 'ACTIVE').toUpperCase();
    if (!validStatuses.includes(targetStatus)) {
      return NextResponse.json(
        { success: false, error: `Status supervisi '${targetStatus}' tidak valid.` },
        { status: 400 }
      );
    }

    const pool = getDbPool();

    // 1. Cek keberadaan Modul Ajar
    const checkRes = await pool.query(
      `SELECT m.*, tp.code AS tp_code FROM modul_ajar m
       JOIN learning_objectives tp ON m.learning_objective_id = tp.id
       WHERE m.id = $1 AND m.deleted_at IS NULL;`,
      [id]
    );

    if (checkRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Modul Ajar tidak ditemukan.' },
        { status: 404 }
      );
    }

    const modul = checkRes.rows[0];

    // 2. Update status dan catatan supervisi kepala sekolah di database PostgreSQL
    const updateRes = await pool.query(
      `UPDATE modul_ajar
       SET 
         status = $1,
         suspension_reason = $2,
         updated_at = NOW()
       WHERE id = $3
       RETURNING *;`,
      [
        targetStatus,
        notes ? `[Supervisi Kepala Sekolah - ${supervisor_name}]: ${notes}` : (targetStatus === 'ACTIVE' || targetStatus === 'APPROVED' ? null : modul.suspension_reason),
        id
      ]
    );

    const updated = updateRes.rows[0];

    return NextResponse.json({
      success: true,
      message: `Modul Ajar '${updated.title}' berhasil disahkan/diperbarui dengan status '${targetStatus}' oleh ${supervisor_name}.`,
      modul_ajar: updated,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
