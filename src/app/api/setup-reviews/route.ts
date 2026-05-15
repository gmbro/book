import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { blockCrossSiteRequest, blockUnlessMaintenanceEnabled } from '@/lib/serverSecurity';

export async function POST(request: NextRequest) {
  const maintenanceBlock = blockUnlessMaintenanceEnabled();
  if (maintenanceBlock) return maintenanceBlock;
  const crossSiteBlock = blockCrossSiteRequest(request);
  if (crossSiteBlock) return crossSiteBlock;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Try to select from book_reviews to check if table exists
  const { error: checkError } = await supabase.from('book_reviews').select('id').limit(1);
  
  if (checkError?.message?.includes('does not exist') || checkError?.message?.includes('schema cache')) {
    return NextResponse.json({ 
      error: 'Table does not exist',
      message: 'Please create the book_reviews table in Supabase SQL Editor',
      sql: `CREATE TABLE IF NOT EXISTS book_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(meeting_id, author_id)
);

ALTER TABLE book_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for book_reviews" ON book_reviews FOR ALL USING (true) WITH CHECK (true);`
    });
  }

  return NextResponse.json({ status: 'ok', message: 'book_reviews table exists' });
}
