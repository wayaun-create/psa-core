import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ acctId: string }> }
) {
  if (!pool) {
    return NextResponse.json(
      { 
        success: false, 
        error: "Database not configured" 
      },
      { status: 503 }
    );
  }
  
  const { acctId } = await params;
  
  try {
    // Get the first client associated with this account
    const clientResult = await pool.query(
      "SELECT client_id, client_name, email, phone, business_type FROM clients WHERE acct_id = $1 LIMIT 1",
      [acctId]
    );
    
    if (clientResult.rows.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "No client found for this account" 
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      client: clientResult.rows[0]
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}
