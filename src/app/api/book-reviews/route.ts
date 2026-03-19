import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get('title');
  if (!title) return NextResponse.json({ reviews: [] });

  try {
    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json({ reviews: [], error: 'Naver API 키가 설정되지 않았습니다.' });
    }

    const query = `${title} 후기 독서`;
    const url = `https://openapi.naver.com/v1/search/blog.json?query=${encodeURIComponent(query)}&display=5&sort=sim`;

    const res = await fetch(url, {
      headers: {
        'X-Naver-Client-Id': clientId,
        'X-Naver-Client-Secret': clientSecret,
      },
    });

    const data = await res.json();

    const reviews = (data.items || []).map((item: { title: string; description: string; bloggername: string; postdate: string; link: string }) => ({
      title: item.title.replace(/<[^>]*>/g, ''),
      snippet: item.description.replace(/<[^>]*>/g, '').slice(0, 120),
      blogger: item.bloggername,
      date: item.postdate,
      link: item.link,
    }));

    return NextResponse.json({ reviews });
  } catch (err) {
    console.error('Naver blog search error:', err);
    return NextResponse.json({ reviews: [] }, { status: 500 });
  }
}
