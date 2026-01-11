import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function POST(request: NextRequest) {
  if (!pool) {
    return NextResponse.json(
      { 
        success: false, 
        error: "Database not configured" 
      },
      { status: 503 }
    );
  }
  
  try {
    const body = await request.json();
    const { email, password } = body;
    
    if (!email || !password) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Email and password are required" 
        },
        { status: 400 }
      );
    }
    
    const result = await pool.query(
      "SELECT acct_id, email FROM accounts WHERE email = $1 AND password = $2",
      [email, password]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid email or password" 
        },
        { status: 401 }
      );
    }
    
    const account = result.rows[0];
    return NextResponse.json({ 
      success: true, 
      acct_id: account.acct_id,
      email: account.email
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}
