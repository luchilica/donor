async function run() {
  const backendUrl = process.env.VITE_API_URL || process.env.BACKEND_URL || 'https://donor-production.up.railway.app';
  const targetUrl = backendUrl.endsWith('/api') ? `${backendUrl}/centers` : `${backendUrl}/api/centers`;
  try {
    console.log(`Fetching from: ${targetUrl}`);
    const response = await fetch(targetUrl);
    console.log(response.status);
    console.log(await response.text());
  } catch (e) {
    console.error(e);
  }
}
run();
