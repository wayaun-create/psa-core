import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET() {
  if (!pool) {
    return NextResponse.json(
      { 
        ok: false, 
        error: "Database not configured. Set DATABASE_URL in .env file" 
      },
      { status: 503 }
    );
  }
  
  try {
    const result = await pool.query("SELECT NOW() as now");
    return NextResponse.json({ ok: true, now: result.rows[0].now });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e.message },
      { status: 500 }
    );
  }
}
