import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taxSaleId: string }> }
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
  
  const { taxSaleId } = await params;
  
  try {
    const result = await pool.query(
      `SELECT parcel_id, file__, map_parcel, def
       FROM parcels
       WHERE tax_sale_id = $1
       ORDER BY parcel_id`,
      [taxSaleId]
    );
    
    return NextResponse.json({ success: true, parcels: result.rows });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}
