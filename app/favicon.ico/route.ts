const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="18" fill="#f8fafc"/>
  <path d="M11 36c7-12 15-12 22 0s15 12 20 0" fill="none" stroke="#0f172a" stroke-width="5" stroke-linecap="round"/>
  <path d="M15 43c6 7 17 8 28 2" fill="none" stroke="#0891b2" stroke-width="4" stroke-linecap="round" opacity=".75"/>
</svg>`;

export function GET() {
  return new Response(faviconSvg, {
    headers: {
      "Cache-Control": "public, max-age=86400",
      "Content-Type": "image/svg+xml; charset=utf-8"
    }
  });
}
