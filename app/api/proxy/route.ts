import { NextRequest, NextResponse } from 'next/server';

const API = process.env.NEXT_PUBLIC_API_URL || 'https://onedot.onrender.com';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || process.env.NEXT_PUBLIC_ADMIN_API_KEY || '';

async function proxyRequest(req: NextRequest) {
  try {
    const target = req.nextUrl.searchParams.get('target');
    if (!target) {
      return NextResponse.json({ error: 'Missing target parameter' }, { status: 400 });
    }

    let baseUrl = API;
    if (baseUrl.startsWith('http://') && !baseUrl.includes('localhost') && !baseUrl.includes('127.0.0.1')) {
      baseUrl = baseUrl.replace('http://', 'https://');
    }
    
    // Ensure target path is formatted correctly, prepending / if necessary
    const rawTarget = target.replace(/^\/api\//, '');
    const url = `${baseUrl}/api/${rawTarget}`;

    const bodyText = await req.text();

    const headers: Record<string, string> = {
      'Content-Type': req.headers.get('content-type') || 'application/json',
    };
    
    if (ADMIN_API_KEY) {
      headers['X-API-Key'] = ADMIN_API_KEY;
    }

    const backendRes = await fetch(url, {
      method: req.method,
      headers,
      body: bodyText ? bodyText : undefined,
    });

    const data = await backendRes.text();
    return new NextResponse(data, {
      status: backendRes.status,
      headers: { 'Content-Type': backendRes.headers.get('content-type') || 'application/json' },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) { return proxyRequest(req); }
export async function PUT(req: NextRequest) { return proxyRequest(req); }
export async function DELETE(req: NextRequest) { return proxyRequest(req); }
export async function PATCH(req: NextRequest) { return proxyRequest(req); }
