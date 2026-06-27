async function run() {
  try {
    const response = await fetch('https://donor-production.up.railway.app/');
    console.log(response.status);
    console.log(await response.text());
  } catch (e) {
    console.error(e);
  }
}
run();
