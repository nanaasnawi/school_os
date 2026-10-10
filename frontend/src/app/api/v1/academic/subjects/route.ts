import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const codeParam = searchParams.get('code');

    const pool = getDbPool();

    let query = `
      SELECT 
        id, 
        code, 
        name, 
        created_at, 
        updated_at
      FROM subjects
      WHERE deleted_at IS NULL
    `;
    const params: any[] = [];

    if (codeParam) {
      params.push(codeParam);
      query += ` AND code = $${params.length}`;
    }

    query += ` ORDER BY name ASC`;

    const res = await pool.query(query, params);

    return NextResponse.json({
      success: true,
      data: res.rows,
      subjects: res.rows,
      total: res.rows.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database error';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
