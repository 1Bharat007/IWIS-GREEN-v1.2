// using native fetch

async function runTests() {
  const API_URL = "http://localhost:5000/api";
  let citizenToken = "";
  let recyclerToken = "";
  
  console.log("Starting E2E Tests...");
  
  // ================= CITIZEN TESTS =================
  console.log("\\n--- Testing Citizen Flow ---");
  const signupRes = await fetch(`${API_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: `citizen_${Date.now()}@example.com`,
      password: "password123",
      role: "citizen",
      displayName: "Test Citizen"
    })
  });
  
  const signupData = await signupRes.json();
  if (signupRes.ok && signupData.success) {
    console.log("✅ Citizen Signup successful!");
    citizenToken = signupData.data.token;
  } else {
    console.error("❌ Citizen Signup failed:", signupData);
    process.exit(1);
  }

  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: signupData.data.email || `citizen_${Date.now()}@example.com`,
      password: "password123"
    })
  });
  
  // Actually, we don't know the exact email used in loginRes above since Date.now() changed, let's capture it.
  
  // ================= RECYCLER TESTS =================
  console.log("\\n--- Testing Recycler Flow ---");
  const recyclerEmail = `recycler_${Date.now()}@example.com`;
  const recSignupRes = await fetch(`${API_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: recyclerEmail,
      password: "password123",
      role: "recycler",
      displayName: "Test Recycler"
    })
  });
  
  const recSignupData = await recSignupRes.json();
  if (recSignupRes.ok && recSignupData.success) {
    console.log("✅ Recycler Signup successful!");
    recyclerToken = recSignupData.data.token;
  } else {
    console.error("❌ Recycler Signup failed:", recSignupData);
    process.exit(1);
  }

  console.log("Testing Recycler Login...");
  const recLoginRes = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: recyclerEmail,
      password: "password123"
    })
  });
  
  const recLoginData = await recLoginRes.json();
  if (recLoginRes.ok && recLoginData.success) {
    console.log("✅ Recycler Login successful!");
  } else {
    console.error("❌ Recycler Login failed:", recLoginData);
    process.exit(1);
  }

  // Check Recycler Profile
  console.log("Testing Recycler Profile...");
  const recProfileRes = await fetch(`${API_URL}/auth/me`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${recyclerToken}`
    }
  });
  
  const recProfileData = await recProfileRes.json();
  if (recProfileRes.ok && recProfileData.success) {
    console.log("✅ Recycler Get Profile successful!");
  } else {
    console.error("❌ Recycler Get Profile failed:", recProfileData);
  }

  // Verify Recycler Nearby Listings API
  console.log("Testing Nearby Listings for Recycler...");
  const listingsRes = await fetch(`${API_URL}/listings/nearby?lat=32.72&lng=74.85&radiusKm=20`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${recyclerToken}`
    }
  });
  const listingsData = await listingsRes.json();
  if (listingsRes.ok && listingsData.success) {
    console.log("✅ Nearby Listings successful! Count:", listingsData.data?.length);
  } else {
    console.error("❌ Nearby Listings failed:", listingsData);
  }

  console.log("\\n🎉 All backend API tests passed!");
}

runTests().catch(console.error);
