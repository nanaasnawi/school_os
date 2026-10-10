import { NextRequest, NextResponse } from 'next/server';

interface YouTubeItem {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  publishedAt: string;
}

function unescapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q')?.trim();
    const maxResults = Math.min(20, Math.max(1, parseInt(searchParams.get('maxResults') || '10', 10)));

    if (!query) {
      return NextResponse.json(
        { success: false, error: 'Parameter pencarian (q) wajib diisi', items: [] },
        { status: 400 }
      );
    }

    // Ambil API Key secara aman dari environment variable server (bukan dari client bundle)
    const apiKey = process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: 'YouTube API Key belum dikonfigurasi di environment server (YOUTUBE_API_KEY).',
          items: []
        },
        { status: 503 }
      );
    }

    const apiUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&key=${apiKey}`;

    const res = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
      // Revalidate cache 5 menit untuk query yang sama guna menghemat kuota API
      next: { revalidate: 300 }
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      let parsedMessage = `YouTube API gagal merespons (HTTP ${res.status})`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson?.error?.message) {
          parsedMessage = errorJson.error.message;
        }
      } catch {
        // Abaikan parse error, gunakan default message
      }

      console.error(`[YouTube API Proxy Error]: HTTP ${res.status} - ${parsedMessage}`);

      return NextResponse.json(
        {
          success: false,
          error: `Gagal memuat hasil pencarian YouTube: ${parsedMessage}`,
          items: []
        },
        { status: res.status >= 500 ? 502 : 400 }
      );
    }

    const data = await res.json();
    const items: YouTubeItem[] = (data.items || []).map((item: any) => ({
      id: item.id?.videoId || '',
      title: unescapeHtml(item.snippet?.title || ''),
      description: unescapeHtml(item.snippet?.description || ''),
      thumbnailUrl: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || '',
      channelTitle: unescapeHtml(item.snippet?.channelTitle || ''),
      publishedAt: item.snippet?.publishedAt || ''
    })).filter((v: YouTubeItem) => Boolean(v.id));

    return NextResponse.json({
      success: true,
      items,
      totalResults: data.pageInfo?.totalResults ?? items.length
    });
  } catch (err: any) {
    console.error('[YouTube API Proxy Exception]:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Terjadi kesalahan internal saat mencari video YouTube',
        items: []
      },
      { status: 500 }
    );
  }
}
