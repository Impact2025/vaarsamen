// Basic health check voor monitoring
// GET /api/health → status/healthz

export async function GET() {
  // Minimal health check - geen DB connectie om cold start te vermijden
  const checks = {
    status: 'ok',
    timestamp: new Date().toISOString(),
  }
  return Response.json(checks, { status: 200 })
}