import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

/**
 * POST /api/v1/learning/pedagogy/cp/school
 * Mendaftarkan naskah Capaian Pembelajaran (CP) resmi tingkat sekolah (KOSP)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      tenant_id,
      subject_name,
      subject_code,
      phase,
      target_grades,
      element_name,
      element_code,
      description,
      source_document = 'Dokumen KOSP Satuan Pendidikan',
      document_page_ref,
      order_index = 0,
      actor_id,
    } = body;

    const cleanSubject = (subject_name || '').trim();
    const cleanPhase = (phase || '').trim().toUpperCase();
    const cleanElement = (element_name || '').trim();
    const cleanDesc = (description || '').trim();

    if (!cleanSubject || !cleanPhase || !cleanElement || !cleanDesc) {
      return NextResponse.json(
        {
          success: false,
          error: "Field 'subject_name', 'phase', 'element_name', dan 'description' wajib diisi",
        },
        { status: 400 }
      );
    }

    const pool = getDbPool();

    const auditTrail = JSON.stringify([
      {
        action: 'SCHOOL_REGISTRATION',
        actor_id: actor_id || null,
        timestamp: new Date().toISOString(),
        notes: 'Didaftarkan oleh satuan pendidikan sebagai kurikulum operasional sekolah (KOSP)',
      },
    ]);

    const insertQuery = `
      INSERT INTO learning_outcomes (
        tenant_id,
        subject_code,
        subject_name,
        phase,
        target_grades,
        element_name,
        element_code,
        description,
        source_origin,
        source_version,
        source_document,
        document_page_ref,
        verification_status,
        verified_by,
        verified_at,
        provenance_audit_trail,
        order_index
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        'SCHOOL_ADAPTED', 'KOSP-1.0', $9, $10,
        'SCHOOL_VERIFIED', $11, NOW(), $12::jsonb, $13
      )
      RETURNING 
        id, tenant_id, subject_code, subject_name, phase, target_grades,
        element_name, element_code, description, source_origin, source_version,
        source_document, document_page_ref, verification_status, order_index,
        created_at, updated_at;
    `;

    const res = await pool.query(insertQuery, [
      tenant_id || null,
      subject_code || null,
      cleanSubject,
      cleanPhase,
      target_grades || '',
      cleanElement,
      element_code || null,
      cleanDesc,
      source_document,
      document_page_ref || null,
      actor_id || null,
      auditTrail,
      order_index,
    ]);

    const row = res.rows[0];

    return NextResponse.json({
      success: true,
      data: {
        ...row,
        is_eligible_source: true,
      },
      message: 'Capaian Pembelajaran (CP) sekolah berhasil didaftarkan dan terverifikasi untuk KOSP.',
    });
  } catch (error: any) {
    console.error('[Register School CP Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Gagal mendaftarkan CP sekolah',
      },
      { status: 500 }
    );
  }
}
