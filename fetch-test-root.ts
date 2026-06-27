async function run() {
  const backendUrl = process.env.VITE_API_URL || process.env.BACKEND_URL || 'https://donor-production.up.railway.app';
  try {
    console.log(`Fetching root from: ${backendUrl}`);
    const response = await fetch(backendUrl);
    console.log(response.status);
    console.log(await response.text());
  } catch (e) {
    console.error(e);
  }
}
run();
