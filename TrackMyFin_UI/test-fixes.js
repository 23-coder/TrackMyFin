// Complete test script to verify fixes
// Run this in your browser console after the fixes

console.log('🔧 Testing Finance Tracker Fixes...');

const API_BASE_URL = 'http://localhost:8080/api';

// Test 1: Health Check
async function testHealthCheck() {
  console.log('\n📊 Test 1: Health Check');
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    console.log(`✅ Health Status: ${response.status}`);
    if (response.ok) {
      const data = await response.json();
      console.log('   Health Data:', data);
    }
  } catch (error) {
    console.log('❌ Health Check Failed:', error);
  }
}

// Test 2: CORS Configuration
async function testCORS() {
  console.log('\n🌐 Test 2: CORS Configuration');
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'OPTIONS',
    });
    console.log(`✅ CORS Preflight Status: ${response.status}`);
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
    };
    console.log('   CORS Headers:', corsHeaders);
  } catch (error) {
    console.log('❌ CORS Test Failed:', error);
  }
}

// Test 3: Authentication Flow
async function testAuth() {
  console.log('\n🔐 Test 3: Authentication Flow');
  
  const testUser = {
    email: 'testuser@example.com',
    password: 'testpassword123',
    firstName: 'Test',
    lastName: 'User',
    phoneNumber: '1234567890'
  };
  
  try {
    // Register
    console.log('   Registering user...');
    const registerResponse = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser),
    });
    
    if (registerResponse.ok) {
      const registerData = await registerResponse.json();
      console.log('✅ Registration successful');
      
      // Test login
      console.log('   Testing login...');
      const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password
        }),
      });
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        console.log('✅ Login successful');
        console.log('   Token received:', loginData.token ? 'Yes' : 'No');
        
        // Store token and test authenticated request
        localStorage.setItem('jwt_token', loginData.token);
        await testAuthenticatedRequest(loginData.token);
        
      } else {
        console.log('❌ Login failed:', loginResponse.status);
      }
      
    } else {
      console.log('❌ Registration failed:', registerResponse.status);
      const errorText = await registerResponse.text();
      console.log('   Error:', errorText);
    }
  } catch (error) {
    console.log('❌ Auth Test Failed:', error);
  }
}

// Test 4: Authenticated Request
async function testAuthenticatedRequest(token) {
  console.log('\n🛡️ Test 4: Authenticated Request');
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Dashboard Stats Status: ${response.status}`);
    if (response.ok) {
      const data = await response.json();
      console.log('   Dashboard Data:', data);
    } else {
      const errorText = await response.text();
      console.log('   Error:', errorText);
    }
  } catch (error) {
    console.log('❌ Authenticated Request Failed:', error);
  }
}

// Test 5: Frontend API Service Integration
async function testFrontendIntegration() {
  console.log('\n🔗 Test 5: Frontend Integration');
  
  // Check if apiService is available
  if (typeof window !== 'undefined' && window.apiService) {
    try {
      console.log('   Testing connection test utility...');
      if (window.testBackendConnection) {
        await window.testBackendConnection();
      }
      
      console.log('   Testing tokenService...');
      const tokenValid = window.tokenService?.isTokenValid();
      console.log(`   Token Valid: ${tokenValid}`);
      
    } catch (error) {
      console.log('❌ Frontend Integration Test Failed:', error);
    }
  } else {
    console.log('⚠️ Frontend API service not found - run this in the React app');
  }
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting comprehensive test suite...');
  
  await testHealthCheck();
  await testCORS();
  await testAuth();
  await testFrontendIntegration();
  
  console.log('\n✨ Test suite completed!');
  console.log('📝 Check the results above for any issues.');
}

// Auto-run tests
runAllTests();

// Export for manual testing
window.financeTrackerTest = {
  runAllTests,
  testHealthCheck,
  testCORS,
  testAuth,
  testAuthenticatedRequest,
  testFrontendIntegration
};