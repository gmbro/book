import { NextRequest, NextResponse } from 'next/server';

const hostFromUrl = (value?: string | null) => {
  if (!value) return null;
  try {
    return new URL(value.startsWith('http') ? value : `https://${value}`).host;
  } catch {
    return null;
  }
};

const allowedHostsFor = (request: NextRequest) => {
  const hosts = new Set<string>();
  const requestHost = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const configuredOrigin = process.env.NEXT_PUBLIC_SITE_URL || process.env.APP_ORIGIN;
  const vercelUrl = process.env.VERCEL_URL;

  [requestHost, hostFromUrl(configuredOrigin), hostFromUrl(vercelUrl)].forEach(host => {
    if (host) hosts.add(host);
  });

  hosts.add('localhost:3000');
  hosts.add('127.0.0.1:3000');
  return hosts;
};

export const blockCrossSiteRequest = (request: NextRequest) => {
  if (request.headers.get('sec-fetch-site') === 'cross-site') {
    return NextResponse.json({ error: 'Cross-site requests are blocked.' }, { status: 403 });
  }

  const allowedHosts = allowedHostsFor(request);
  const originHost = hostFromUrl(request.headers.get('origin'));
  const refererHost = hostFromUrl(request.headers.get('referer'));
  const suppliedHost = originHost || refererHost;

  if (suppliedHost && !allowedHosts.has(suppliedHost)) {
    return NextResponse.json({ error: 'Request origin is not allowed.' }, { status: 403 });
  }

  return null;
};

export const blockUnlessMaintenanceEnabled = () => {
  if (process.env.ENABLE_MAINTENANCE_ROUTES === 'true') return null;
  return NextResponse.json({ error: 'Maintenance route is disabled.' }, { status: 404 });
};
