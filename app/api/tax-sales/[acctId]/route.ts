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
    const result = await pool.query(
      `SELECT ts.tax_sale_id, ts.tax_sale_name, ts.sale_date, ts.county, ts.status
       FROM tax_sales ts
       INNER JOIN clients c ON ts.client_id = c.client_id
       WHERE c.acct_id = $1
       ORDER BY ts.sale_date DESC`,
      [acctId]
    );
    
    // Log status values for debugging
    console.log('Tax sales for account', acctId, ':', result.rows.map((ts: any) => ({ 
      id: ts.tax_sale_id, 
      name: ts.tax_sale_name, 
      status: ts.status 
    })));
    
    return NextResponse.json({ success: true, taxSales: result.rows });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}
