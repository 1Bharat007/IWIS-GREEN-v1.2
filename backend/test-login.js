// Test backend health / me endpoint
fetch('http://localhost:5000/api/auth/me', {
  headers: { 'Authorization': 'Bearer test' }
})
.then(res => res.text().then(text => console.log(res.status, text)))
.catch(console.error);
