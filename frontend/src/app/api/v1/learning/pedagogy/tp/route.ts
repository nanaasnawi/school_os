import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

/**
 * PUT /api/v1/learning/pedagogy/tp
 * Guru menyunting rincian Tujuan Pembelajaran (TP) & menandai selesai ditinjau (REVIEWED)
 */
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      statement,
      competency,
      bloom_level,
      content_scope,
      estimated_hours,
      pancasila_profiles,
      evidence_indicators,
      mark_as_reviewed = true,
      actor_id = null,
    } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Parameter 'id' Tujuan Pembelajaran wajib diisi" },
        { status: 400 }
      );
    }

    const pool = getDbPool();

    // Pastikan TP ada dan bukan berstatus ARCHIVED
    const checkRes = await pool.query(
      `SELECT id, publication_status, version FROM learning_objectives WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );

    if (checkRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Tujuan Pembelajaran tidak ditemukan' },
        { status: 404 }
      );
    }

    const currentStatus = checkRes.rows[0].publication_status;
    const newStatus = currentStatus === 'PUBLISHED'
      ? 'PUBLISHED'
      : mark_as_reviewed
        ? 'REVIEWED'
        : currentStatus;

    const updateRes = await pool.query(
      `
      UPDATE learning_objectives
      SET 
        statement = COALESCE($2, statement),
        competency = COALESCE($3, competency),
        bloom_level = COALESCE($4, bloom_level),
        content_scope = COALESCE($5, content_scope),
        estimated_hours = COALESCE($6, estimated_hours),
        pancasila_profiles = COALESCE($7, pancasila_profiles),
        evidence_indicators = COALESCE($8, evidence_indicators),
        publication_status = $9,
        reviewed_by = CASE WHEN $9 = 'REVIEWED' THEN $10::uuid ELSE reviewed_by END,
        reviewed_at = CASE WHEN $9 = 'REVIEWED' THEN NOW() ELSE reviewed_at END,
        updated_at = NOW()
      WHERE id = $1
      RETURNING id, code, competency, bloom_level, content_scope, statement,
                pancasila_profiles, evidence_indicators, estimated_hours, publication_status, version;
    `,
      [
        id,
        statement || null,
        competency || null,
        bloom_level || null,
        content_scope || null,
        estimated_hours ? parseInt(estimated_hours, 10) : null,
        Array.isArray(pancasila_profiles) ? pancasila_profiles : null,
        Array.isArray(evidence_indicators) ? evidence_indicators : null,
        newStatus,
        actor_id || null,
      ]
    );

    const updatedTp = updateRes.rows[0];

    return NextResponse.json({
      success: true,
      data: updatedTp,
      message: `Tujuan Pembelajaran '${updatedTp.code}' berhasil disunting (Status: ${updatedTp.publication_status}).`,
    });
  } catch (err: any) {
    console.error('[Update TP Error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal menyunting Tujuan Pembelajaran' },
      { status: 500 }
    );
  }
}
