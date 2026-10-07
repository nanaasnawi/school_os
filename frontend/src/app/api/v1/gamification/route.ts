import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

const XP_MAP: Record<string, number> = {
  READ_MATERIAL: 25,
  SUBMIT_ASSIGNMENT: 50,
  COMPLETE_QUIZ: 100,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { student_id, action_type, reference_id, description, tenant_id } = body;

    if (!student_id || !action_type || !reference_id) {
      return NextResponse.json(
        { success: false, error: 'student_id, action_type, and reference_id are required' },
        { status: 400 }
      );
    }

    const xpAmount = XP_MAP[action_type.toUpperCase()] || 25;
    const pool = getDbPool();

    // Resolve student_id: handles both student table PK and user_id from auth token
    let effectiveStudentId = student_id;
    let effectiveTenantId = tenant_id;
    const studentLookup = await pool.query(
      'SELECT id, tenant_id FROM students WHERE id = $1 OR user_id = $1 LIMIT 1',
      [student_id]
    );
    if (studentLookup.rows.length > 0) {
      effectiveStudentId = studentLookup.rows[0].id;
      if (!effectiveTenantId) effectiveTenantId = studentLookup.rows[0].tenant_id;
    }

    // 1. Check if XP already awarded for this specific activity to avoid duplicates
    const checkQuery = `
      SELECT id, xp_amount FROM student_xp_transactions
      WHERE student_id = $1 AND action_type = $2 AND reference_id = $3
      LIMIT 1
    `;
    const checkRes = await pool.query(checkQuery, [effectiveStudentId, action_type.toUpperCase(), reference_id]);

    if (checkRes.rows.length > 0) {
      // Already awarded, return current total XP without re-awarding
      const currentRes = await pool.query(
        'SELECT total_xp, level, streak_days FROM student_xp WHERE student_id = $1',
        [effectiveStudentId]
      );
      const row = currentRes.rows[0] || { total_xp: 0, level: 1, streak_days: 1 };
      return NextResponse.json({
        success: true,
        awarded: false,
        already_awarded: true,
        xp_earned: 0,
        total_xp: Number(row.total_xp),
        level: Number(row.level),
        streak_days: Number(row.streak_days),
        message: 'XP sudah pernah diraih untuk aktivitas ini.',
      });
    }

    // 2. Fetch student's tenant_id if not yet found
    if (!effectiveTenantId) {
      const studentInfo = await pool.query(
        'SELECT tenant_id FROM users WHERE id = $1 LIMIT 1',
        [student_id]
      );
      if (studentInfo.rows.length > 0) {
        effectiveTenantId = studentInfo.rows[0].tenant_id;
      }
    }

    // 3. Insert transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const txInsertQuery = `
        INSERT INTO student_xp_transactions (id, tenant_id, student_id, action_type, reference_id, xp_amount, description, created_at)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW())
      `;
      await client.query(txInsertQuery, [
        effectiveTenantId || null,
        effectiveStudentId,
        action_type.toUpperCase(),
        reference_id,
        xpAmount,
        description || `Penyelesaian aktivitas ${action_type}`,
      ]);

      // 4. Upsert student_xp
      const upsertQuery = `
        INSERT INTO student_xp (student_id, tenant_id, total_xp, level, streak_days, last_activity_date, created_at, updated_at)
        VALUES (
          $1, $2, $3,
          FLOOR(SQRT($3 / 50.0)) + 1,
          1,
          CURRENT_DATE,
          NOW(), NOW()
        )
        ON CONFLICT (student_id) DO UPDATE SET
          total_xp = student_xp.total_xp + EXCLUDED.total_xp,
          level = FLOOR(SQRT((student_xp.total_xp + EXCLUDED.total_xp) / 50.0)) + 1,
          streak_days = CASE
            WHEN student_xp.last_activity_date = CURRENT_DATE THEN student_xp.streak_days
            WHEN student_xp.last_activity_date = CURRENT_DATE - 1 THEN student_xp.streak_days + 1
            ELSE 1
          END,
          last_activity_date = CURRENT_DATE,
          updated_at = NOW()
        RETURNING total_xp, level, streak_days;
      `;
      const upsertRes = await client.query(upsertQuery, [effectiveStudentId, effectiveTenantId || null, xpAmount]);

      await client.query('COMMIT');

      const resultRow = upsertRes.rows[0];
      return NextResponse.json({
        success: true,
        awarded: true,
        already_awarded: false,
        xp_earned: xpAmount,
        total_xp: Number(resultRow.total_xp),
        level: Number(resultRow.level),
        streak_days: Number(resultRow.streak_days),
        action_type: action_type.toUpperCase(),
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('Gamification award error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal memproses gamifikasi XP' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const student_id = searchParams.get('student_id');

    if (!student_id) {
      return NextResponse.json(
        { success: false, error: 'student_id is required' },
        { status: 400 }
      );
    }

    const pool = getDbPool();
    let effectiveStudentId = student_id;
    const studentLookup = await pool.query(
      'SELECT id FROM students WHERE id = $1 OR user_id = $1 LIMIT 1',
      [student_id]
    );
    if (studentLookup.rows.length > 0) {
      effectiveStudentId = studentLookup.rows[0].id;
    }

    const xpRes = await pool.query(
      'SELECT total_xp, level, streak_days, last_activity_date FROM student_xp WHERE student_id = $1',
      [effectiveStudentId]
    );

    const row = xpRes.rows[0] || {
      total_xp: 0,
      level: 1,
      streak_days: 1,
      last_activity_date: null,
    };

    const totalXp = Number(row.total_xp);
    const level = Number(row.level);
    const currentBase = Math.pow(level - 1, 2) * 50;
    const nextTarget = Math.pow(level, 2) * 50;
    const progressPercent = Math.min(100, Math.max(0, Math.round(((totalXp - currentBase) / (nextTarget - currentBase || 1)) * 100)));

    const txRes = await pool.query(
      `SELECT id, action_type, reference_id, xp_amount, description, created_at
       FROM student_xp_transactions
       WHERE student_id = $1
       ORDER BY created_at DESC LIMIT 10`,
      [effectiveStudentId]
    );

    return NextResponse.json({
      success: true,
      data: {
        student_id,
        total_xp: totalXp,
        level,
        streak_days: Number(row.streak_days),
        last_activity_date: row.last_activity_date,
        progress_to_next_level: progressPercent,
        next_level_target_xp: nextTarget,
        transactions: txRes.rows,
      },
    });
  } catch (err: any) {
    console.error('Gamification get error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Gagal mengambil data gamifikasi' },
      { status: 500 }
    );
  }
}
