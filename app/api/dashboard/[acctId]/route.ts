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
    // Get account info
    const accountResult = await pool.query(
      "SELECT email FROM accounts WHERE acct_id = $1",
      [acctId]
    );
    
    if (accountResult.rows.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Account not found" 
        },
        { status: 404 }
      );
    }
    
    // Get client count for this account
    const clientResult = await pool.query(
      "SELECT COUNT(*) as count FROM clients WHERE acct_id = $1",
      [acctId]
    );
    
    // Get tax sales count for this account's clients
    const taxSaleResult = await pool.query(
      `SELECT COUNT(*) as count FROM tax_sales ts 
       INNER JOIN clients c ON ts.client_id = c.client_id 
       WHERE c.acct_id = $1`,
      [acctId]
    );
    
    // Get parcel count for this account's tax sales
    const parcelResult = await pool.query(
      `SELECT COUNT(*) as count FROM parcels p
       INNER JOIN tax_sales ts ON p.tax_sale_id = ts.tax_sale_id
       INNER JOIN clients c ON ts.client_id = c.client_id
       WHERE c.acct_id = $1`,
      [acctId]
    );
    
    return NextResponse.json({
      success: true,
      email: accountResult.rows[0].email,
      clientCount: parseInt(clientResult.rows[0].count),
      taxSaleCount: parseInt(taxSaleResult.rows[0].count),
      parcelCount: parseInt(parcelResult.rows[0].count)
    });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}
