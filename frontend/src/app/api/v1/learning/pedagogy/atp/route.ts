import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

/**
 * GET /api/v1/learning/pedagogy/atp
 * Mengambil matriks Alur Tujuan Pembelajaran (ATP) per semester ganjil & genap
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sourceCpId = searchParams.get('source_cp_id');
    const academicYear = searchParams.get('academic_year') || '2026/2027';
    const tenantId = searchParams.get('tenantId') || null;

    if (!sourceCpId) {
      return NextResponse.json(
        { success: false, error: "Parameter 'source_cp_id' wajib diisi" },
        { status: 400 }
      );
    }

    const pool = getDbPool();

    const query = `
      SELECT 
        tp.id as tp_id,
        tp.code,
        tp.competency,
        tp.bloom_level,
        tp.content_scope,
        tp.statement,
        tp.pancasila_profiles,
        tp.evidence_indicators,
        tp.estimated_hours,
        tp.publication_status,
        tp.version,
        atp.id as atp_id,
        atp.semester,
        atp.sequence_order,
        atp.allocated_hours,
        atp.pedagogical_approach,
        lo.subject_name,
        lo.phase,
        lo.element_name
      FROM learning_objectives tp
      JOIN learning_outcomes lo ON lo.id = tp.learning_outcome_id
      LEFT JOIN learning_objective_flows atp ON atp.learning_objective_id = tp.id
      WHERE tp.learning_outcome_id = $1::uuid
        AND tp.is_superseded = false
        AND ($2::uuid IS NULL OR tp.tenant_id = $2::uuid OR tp.tenant_id IS NULL)
      ORDER BY atp.semester ASC, atp.sequence_order ASC, tp.order_index ASC;
    `;

    const res = await pool.query(query, [sourceCpId, tenantId]);

    const oddItems = res.rows.filter((r: any) => r.semester === 'ODD');
    const evenItems = res.rows.filter((r: any) => r.semester === 'EVEN');

    const oddHours = oddItems.reduce((acc: number, r: any) => acc + (parseInt(r.allocated_hours || r.estimated_hours, 10) || 0), 0);
    const evenHours = evenItems.reduce((acc: number, r: any) => acc + (parseInt(r.allocated_hours || r.estimated_hours, 10) || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        academic_year: academicYear,
        total_items: res.rows.length,
        total_hours: oddHours + evenHours,
        odd_semester: {
          items_count: oddItems.length,
          total_hours: oddHours,
          items: oddItems,
        },
        even_semester: {
          items_count: evenItems.length,
          total_hours: evenHours,
          items: evenItems,
        },
      },
    });
  } catch (err: any) {
    console.error('[Get ATP Error]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal mengambil data alur tujuan pembelajaran' },
      { status: 500 }
    );
  }
}
