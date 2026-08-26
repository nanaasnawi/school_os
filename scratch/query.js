async function main() {
  const res = await fetch('http://localhost:8000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@school.os', password: 'admin123' })
  });
  console.log(res.status);
  console.log(await res.json());
}
main().catch(console.error);
