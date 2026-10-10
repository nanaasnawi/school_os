import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export interface LearningOutcomeElement {
  id: string;
  tenant_id: string | null;
  subject_code: string | null;
  subject_name: string;
  phase: string;
  target_grades: string;
  element_name: string;
  element_code: string | null;
  description: string;
  source_origin: string;
  source_version: string;
  source_document: string | null;
  document_page_ref: string | null;
  verification_status: string;
  is_eligible_source: boolean;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface CpRegistryLookupResponse {
  phase: string;
  subject_query: string;
  source_available: boolean;
  eligible_for_ai_synthesis: boolean;
  elements_count: number;
  elements: LearningOutcomeElement[];
  message: string;
}

/**
 * GET /api/v1/learning/pedagogy/cp
 * Mencari naskah Capaian Pembelajaran (CP) resmi di registry kurikulum
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phase = (searchParams.get('phase') || '').trim().toUpperCase();
    const subject = (searchParams.get('subject') || '').trim();
    const verification = (searchParams.get('verification') || 'ALL').trim().toUpperCase();
    const tenantId = searchParams.get('tenantId') || null;

    if (!phase) {
      return NextResponse.json(
        {
          success: false,
          error: "Parameter 'phase' wajib diisi (contoh: FASE_A, FASE_B, FASE_C, FASE_D, FASE_E, FASE_F)",
        },
        { status: 400 }
      );
    }

    if (!subject) {
      return NextResponse.json(
        {
          success: false,
          error: "Parameter 'subject' (kode atau nama mata pelajaran) wajib diisi",
        },
        { status: 400 }
      );
    }

    const pool = getDbPool();
    const subjectPattern = `%${subject}%`;

    const query = `
      SELECT 
        id,
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
        order_index,
        created_at,
        updated_at
      FROM learning_outcomes
      WHERE ($1::uuid IS NULL OR tenant_id = $1::uuid OR tenant_id IS NULL)
        AND UPPER(phase) = $2
        AND (
          LOWER(subject_name) LIKE LOWER($3)
          OR subject_code = $4
        )
        AND deleted_at IS NULL
        AND (
          $5 = 'ALL'
          OR ($5 = 'VERIFIED_ONLY' AND verification_status IN ('NATIONAL_VERIFIED', 'SCHOOL_VERIFIED'))
          OR ($5 = 'DRAFT_ONLY' AND verification_status = 'UNVERIFIED_DRAFT')
        )
      ORDER BY 
        CASE 
          WHEN verification_status = 'NATIONAL_VERIFIED' THEN 1
          WHEN verification_status = 'SCHOOL_VERIFIED' THEN 2
          ELSE 3 
        END,
        order_index ASC;
    `;

    const res = await pool.query(query, [
      tenantId,
      phase,
      subjectPattern,
      subject,
      verification,
    ]);

    const elements: LearningOutcomeElement[] = res.rows.map((r: any) => {
      const isEligible =
        r.verification_status === 'NATIONAL_VERIFIED' ||
        r.verification_status === 'SCHOOL_VERIFIED';

      return {
        id: r.id,
        tenant_id: r.tenant_id,
        subject_code: r.subject_code,
        subject_name: r.subject_name,
        phase: r.phase,
        target_grades: r.target_grades,
        element_name: r.element_name,
        element_code: r.element_code,
        description: r.description,
        source_origin: r.source_origin,
        source_version: r.source_version,
        source_document: r.source_document,
        document_page_ref: r.document_page_ref,
        verification_status: r.verification_status,
        is_eligible_source: isEligible,
        order_index: r.order_index,
        created_at: r.created_at,
        updated_at: r.updated_at,
      };
    });

    const eligibleCount = elements.filter((e) => e.is_eligible_source).length;
    const hasEligible = eligibleCount > 0;

    let message = '';
    if (hasEligible) {
      message = `Ditemukan ${eligibleCount} elemen Capaian Pembelajaran (CP) terverifikasi untuk ${subject} pada ${phase}.`;
    } else if (elements.length > 0) {
      message = `Naskah CP untuk ${subject} (${phase}) ditemukan sebanyak ${elements.length} elemen, namun statusnya masih UNVERIFIED_DRAFT dan belum disahkan sebagai sumber resmi.`;
    } else {
      message = `Naskah CP resmi belum tersedia di registry untuk mata pelajaran '${subject}' pada ${phase}. Silakan daftarkan dokumen KOSP resmi sekolah terlebih dahulu.`;
    }

    const responseData: CpRegistryLookupResponse = {
      phase,
      subject_query: subject,
      source_available: hasEligible,
      eligible_for_ai_synthesis: hasEligible,
      elements_count: elements.length,
      elements,
      message,
    };

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error: any) {
    console.error('[CP Registry Error]:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Gagal memproses pencarian Capaian Pembelajaran di registry',
      },
      { status: 500 }
    );
  }
}
