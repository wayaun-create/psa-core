import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ parcelId: string }> }
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
  
  const { parcelId } = await params;
  
  try {
    const result = await pool.query(
      "SELECT * FROM parcels WHERE parcel_id = $1",
      [parcelId]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Parcel not found" 
        },
        { status: 404 }
      );
    }
    
    // Filter out null/empty fields
    const parcel = result.rows[0];
    const filteredParcel: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(parcel)) {
      if (value !== null && value !== '') {
        filteredParcel[key] = value;
      }
    }
    
    return NextResponse.json({ success: true, parcel: filteredParcel });
  } catch (e: any) {
    return NextResponse.json(
      { success: false, error: e.message },
      { status: 500 }
    );
  }
}
