fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'demo@iwis.app', password: 'password123' })
})
.then(res => res.text().then(text => console.log(res.status, text)))
.catch(console.error);
