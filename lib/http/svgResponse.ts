export const CACHE_OK = 1800;
export const CACHE_ERR = 60;

export function svgResponse(svgBody: string, maxAgeSeconds: number): Response {
  return new Response(svgBody, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": `public, max-age=${maxAgeSeconds}`,
    },
  });
}
