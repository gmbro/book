import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('q');
  if (!query) return NextResponse.json({ items: [] });

  try {
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY || '';
    const keyParam = apiKey ? `&key=${apiKey}` : '';
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&langRestrict=ko&maxResults=8&printType=books${keyParam}`;
    const res = await fetch(url);
    const data = await res.json();

    const items = (data.items || []).map((item: { id: string; volumeInfo: { title?: string; authors?: string[]; description?: string; imageLinks?: { thumbnail?: string }; publishedDate?: string; publisher?: string; averageRating?: number; ratingsCount?: number; pageCount?: number; categories?: string[] } }) => ({
      id: item.id,
      title: item.volumeInfo.title || '',
      author: (item.volumeInfo.authors || []).join(', '),
      description: item.volumeInfo.description || '',
      thumbnail: item.volumeInfo.imageLinks?.thumbnail?.replace('http://', 'https://') || null,
      publishedDate: item.volumeInfo.publishedDate || '',
      publisher: item.volumeInfo.publisher || '',
      rating: item.volumeInfo.averageRating || null,
      ratingsCount: item.volumeInfo.ratingsCount || 0,
      pageCount: item.volumeInfo.pageCount || 0,
      categories: item.volumeInfo.categories || [],
    }));

    return NextResponse.json({ items });
  } catch (err) {
    console.error('Book search error:', err);
    return NextResponse.json({ items: [] }, { status: 500 });
  }
}
