import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

/**
 * POST /api/v1/learning/pedagogy/publish
 * Transaksional: Guru / Tim Kurikulum meresmikan rancangan TP & ATP menjadi PUBLISHED
 */
export async function POST(req: NextRequest) {
  const pool = getDbPool();
  const client = await pool.connect();

  try {
    const body = await req.json();
    const {
      tp_ids,
      academic_year = '2026/2027',
      grade_level = 'Kelas 5 SD',
      tenant_id = null,
      actor_id = null,
    } = body;

    if (!Array.isArray(tp_ids) || tp_ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Daftar ID TP (tp_ids) wajib disertakan' },
        { status: 400 }
      );
    }

    // 1. Cek alokasi Kaldik tenant untuk validasi pedagogis
    const kaldikRes = await pool.query(
      `
      SELECT 
        COUNT(CASE WHEN semester = 'ODD' AND is_effective_learning THEN 1 END) as odd_heb,
        COUNT(CASE WHEN semester = 'EVEN' AND is_effective_learning THEN 1 END) as even_heb
      FROM academic_calendar_events
      WHERE (tenant_id = $1::uuid OR tenant_id IS NULL)
        AND academic_year = $2
        AND deleted_at IS NULL
    `,
      [tenant_id, academic_year]
    );

    const oddHeb = parseInt(kaldikRes.rows[0]?.odd_heb || '0', 10);
    const evenHeb = parseInt(kaldikRes.rows[0]?.even_heb || '0', 10);

    // 2. Transaksi Database ACID untuk menerbitkan TP & ATP
    await client.query('BEGIN');

    // Update status TP
    const tpUpdate = await client.query(
      `
      UPDATE learning_objectives
      SET 
        publication_status = 'PUBLISHED',
        published_by = $2::uuid,
        published_at = NOW(),
        updated_at = NOW()
      WHERE id = ANY($1::uuid[])
        AND ($3::uuid IS NULL OR tenant_id = $3::uuid OR tenant_id IS NULL)
      RETURNING id, code, estimated_hours;
    `,
      [tp_ids, actor_id, tenant_id]
    );

    if (tpUpdate.rows.length === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json(
        {
          success: false,
          error: 'Tidak ada Tujuan Pembelajaran yang cocok untuk diterbitkan pada sekolah ini.',
        },
        { status: 404 }
      );
    }

    // Update status ATP
    const atpUpdate = await client.query(
      `
      UPDATE learning_objective_flows
      SET 
        publication_status = 'PUBLISHED',
        published_by = $2::uuid,
        published_at = NOW(),
        updated_at = NOW()
      WHERE learning_objective_id = ANY($1::uuid[])
        AND ($3::uuid IS NULL OR tenant_id = $3::uuid OR tenant_id IS NULL)
      RETURNING id, learning_objective_id, semester, allocated_hours, sequence_order;
    `,
      [tp_ids, actor_id, tenant_id]
    );

    // Hitung total jam
    const totalPublishedHours = tpUpdate.rows.reduce(
      (sum: number, r: any) => sum + (parseInt(r.estimated_hours, 10) || 0),
      0
    );

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      data: {
        published_tp_count: tpUpdate.rows.length,
        published_atp_count: atpUpdate.rows.length,
        total_allocated_hours: totalPublishedHours,
        academic_year,
        grade_level,
        kaldik_context: {
          odd_heb: oddHeb,
          even_heb: evenHeb,
          estimated_meb_weeks: 35, // 18 ganjil + 17 genap
        },
      },
      message: `Sukses menerbitkan ${tpUpdate.rows.length} butir TP dan alur ATP (Total ${totalPublishedHours} JP) untuk Tahun Ajaran ${academic_year}. Perangkat pembelajaran kini aktif dan siap dipakai untuk Modul Ajar & Asesmen!`,
    });
  } catch (err: any) {
    await client.query('ROLLBACK');
    console.error('[Publish ATP Error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal mempublikasikan alur pembelajaran' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
