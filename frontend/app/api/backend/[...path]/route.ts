import { NextRequest, NextResponse } from 'next/server';
import { serverConfig } from '@/lib/server-config';

const allowedPrefixes = new Set(['auth', 'titles', 'media', 'profile', 'favorites']);

type RouteParams = { path?: string[] };

async function proxy(
  req: NextRequest,
  context: { params: RouteParams | Promise<RouteParams> },
) {
  const params = await context.params;
  const pathSegments = params.path ?? [];

  if (pathSegments.length === 0) {
    return NextResponse.json({ message: 'Path is required' }, { status: 400 });
  }

  const [firstSegment] = pathSegments;
  if (!allowedPrefixes.has(firstSegment)) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  const targetUrl = new URL(pathSegments.join('/'), `${serverConfig.apiBaseUrl}/`);
  targetUrl.search = req.nextUrl.search;

  const headers = new Headers(req.headers);
  headers.delete('content-length');
  headers.set('host', targetUrl.host);

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: 'manual',
  };

  if (req.body && !['GET', 'HEAD'].includes(req.method)) {
    init.body = req.body;
    // @ts-expect-error duplex is not in types yet but required for streaming bodies
    init.duplex = 'half';
  }

  const backendResponse = await fetch(targetUrl, init);

  const responseHeaders = new Headers();
  backendResponse.headers.forEach((value, key) => {
    if (key.toLowerCase() === 'content-length') {
      return;
    }

    responseHeaders.append(key, value);
  });

  return new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    statusText: backendResponse.statusText,
    headers: responseHeaders,
  });
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
