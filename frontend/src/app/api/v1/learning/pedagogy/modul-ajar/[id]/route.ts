import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pool = getDbPool();

    const query = `
      SELECT 
        m.*,
        tp.code AS tp_code,
        tp.statement AS tp_statement,
        tp.competency AS tp_competency,
        tp.content_scope AS tp_content_scope,
        tp.publication_status AS tp_publication_status,
        tp.estimated_hours AS tp_estimated_hours
      FROM modul_ajar m
      JOIN learning_objectives tp ON m.learning_objective_id = tp.id
      WHERE m.id = $1 AND m.deleted_at IS NULL;
    `;

    const res = await pool.query(query, [id]);
    if (res.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Modul Ajar tidak ditemukan.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, modul_ajar: res.rows[0] });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const pool = getDbPool();

    // Pastikan modul ajar ada
    const existingRes = await pool.query(
      `SELECT * FROM modul_ajar WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    if (existingRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Modul Ajar tidak ditemukan.' },
        { status: 404 }
      );
    }
    const existing = existingRes.rows[0];

    const {
      title = existing.title,
      meaningful_understanding = existing.meaningful_understanding,
      trigger_questions = existing.trigger_questions,
      differentiation_strategies = existing.differentiation_strategies,
      learning_activities = existing.learning_activities,
      assessment_plan = existing.assessment_plan,
      lkpd_attachments = existing.lkpd_attachments,
      allocated_hours = existing.allocated_hours,
      total_meetings = existing.total_meetings,
      hours_per_meeting = existing.hours_per_meeting,
      pancasila_profiles = existing.pancasila_profiles,
    } = body;

    const updateRes = await pool.query(
      `UPDATE modul_ajar
       SET 
         title = $1,
         meaningful_understanding = $2,
         trigger_questions = $3,
         differentiation_strategies = $4,
         learning_activities = $5,
         assessment_plan = $6,
         lkpd_attachments = $7,
         allocated_hours = $8,
         total_meetings = $9,
         hours_per_meeting = $10,
         pancasila_profiles = $11,
         version = version + 1,
         updated_at = NOW()
       WHERE id = $12
       RETURNING *;`,
      [
        title,
        meaningful_understanding,
        JSON.stringify(trigger_questions),
        JSON.stringify(differentiation_strategies),
        JSON.stringify(learning_activities),
        JSON.stringify(assessment_plan),
        JSON.stringify(lkpd_attachments),
        allocated_hours,
        total_meetings,
        hours_per_meeting,
        pancasila_profiles,
        id,
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Modul Ajar berhasil diperbarui.',
      modul_ajar: updateRes.rows[0],
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const pool = getDbPool();

    const res = await pool.query(
      `UPDATE modul_ajar
       SET deleted_at = NOW()
       WHERE id = $1 AND deleted_at IS NULL
       RETURNING id;`,
      [id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Modul Ajar tidak ditemukan.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Modul Ajar berhasil dihapus.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
