import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import OpenAI from 'openai';

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
    const { message, acct_id } = body;
    
    if (!message || !acct_id) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Message and account ID are required" 
        },
        { status: 400 }
      );
    }
    
    // Get user's parcel data for context
    const parcelsResult = await pool.query(
      `SELECT p.parcel_id, p.map_parcel, p.def, p.file__, p.county, 
              ts.tax_sale_name, ts.sale_date, ts.county as tax_sale_county
       FROM parcels p
       INNER JOIN tax_sales ts ON p.tax_sale_id = ts.tax_sale_id
       INNER JOIN clients c ON ts.client_id = c.client_id
       WHERE c.acct_id = $1
       LIMIT 500`,
      [acct_id]
    );
    
    // Get tax sales summary
    const taxSalesResult = await pool.query(
      `SELECT ts.tax_sale_id, ts.tax_sale_name, ts.sale_date, ts.county,
              COUNT(p.parcel_id) as parcel_count
       FROM tax_sales ts
       INNER JOIN clients c ON ts.client_id = c.client_id
       LEFT JOIN parcels p ON ts.tax_sale_id = p.tax_sale_id
       WHERE c.acct_id = $1
       GROUP BY ts.tax_sale_id, ts.tax_sale_name, ts.sale_date, ts.county`,
      [acct_id]
    );
    
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.log('OPENAI_API_KEY is missing or empty');
      // Fallback to simple keyword matching if no API key
      return NextResponse.json({ 
        success: true, 
        response: `AI chat requires an OPENAI_API_KEY environment variable. Please add it to enable intelligent responses.<br><br>You have ${parcelsResult.rows.length} total parcels across ${taxSalesResult.rows.length} tax sales.`
      });
    }
    
    console.log('OPENAI_API_KEY is present:', process.env.OPENAI_API_KEY ? 'YES (starts with ' + process.env.OPENAI_API_KEY.substring(0, 8) + '...)' : 'NO');

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const context = `You are a helpful assistant for a property tax sale management system. 
The user has access to the following data:

TAX SALES:
${taxSalesResult.rows.map((ts: any) => 
  `- Tax Sale ${ts.tax_sale_id}: ${ts.tax_sale_name} (${ts.county || 'Unknown County'}, ${ts.sale_date ? new Date(ts.sale_date).toLocaleDateString() : 'No date'}) - ${ts.parcel_count} parcels`
).join('\n')}

TOTAL PARCELS: ${parcelsResult.rows.length}

Sample parcels (showing first 20):
${parcelsResult.rows.slice(0, 20).map((p: any) => 
  `- Parcel ${p.parcel_id}: ${p.map_parcel || 'N/A'} in ${p.county || 'Unknown County'}, Defendant: ${p.def || 'N/A'}, File: ${p.file__ || 'N/A'}`
).join('\n')}

Answer the user's question about their parcels. Be concise and helpful. Use HTML line breaks (<br>) for formatting.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: context },
        { role: "user", content: message }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });
    
    const aiResponse = completion.choices[0].message.content;
    return NextResponse.json({ success: true, response: aiResponse });
  } catch (e: any) {
    console.error('Chat error:', e);
    
    // Fallback response
    return NextResponse.json({ 
      success: true, 
      response: "I'm having trouble processing your request. Please try asking about parcel counts, tax sales, or specific defendants."
    });
  }
}
