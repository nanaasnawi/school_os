import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { grades } = body; // Array of { student_id, raw_score, qualitative_level, feedback_notes, strengths, areas_for_improvement }

    if (!Array.isArray(grades)) {
      return NextResponse.json(
        { success: false, error: 'Payload grades harus berupa array.' },
        { status: 400 }
      );
    }

    const pool = getDbPool();

    // Pastikan asesmen valid
    const assessRes = await pool.query(
      `SELECT id, tenant_id FROM pedagogical_assessments WHERE id = $1 AND deleted_at IS NULL;`,
      [id]
    );

    if (assessRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Asesmen tidak ditemukan.' },
        { status: 404 }
      );
    }

    const tenantId = assessRes.rows[0].tenant_id;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      for (const item of grades) {
        if (!item.student_id) continue;

        await client.query(
          `INSERT INTO assessment_student_results (
            tenant_id, assessment_id, student_id, raw_score, qualitative_level,
            feedback_notes, strengths, areas_for_improvement, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, NOW()
          )
          ON CONFLICT (assessment_id, student_id) DO UPDATE SET
            raw_score = EXCLUDED.raw_score,
            qualitative_level = EXCLUDED.qualitative_level,
            feedback_notes = EXCLUDED.feedback_notes,
            strengths = EXCLUDED.strengths,
            areas_for_improvement = EXCLUDED.areas_for_improvement,
            updated_at = NOW();`,
          [
            tenantId,
            id,
            item.student_id,
            item.raw_score !== undefined && item.raw_score !== null && item.raw_score !== '' ? Number(item.raw_score) : null,
            item.qualitative_level || null,
            item.feedback_notes || null,
            item.strengths || null,
            item.areas_for_improvement || null,
          ]
        );
      }

      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil menyimpan nilai untuk ${grades.length} peserta didik.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
