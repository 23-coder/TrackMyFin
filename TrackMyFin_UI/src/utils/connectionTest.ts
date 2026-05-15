// Simple connection test utility for backend verification
export const testBackendConnection = async () => {
  const API_BASE_URL = 'http://localhost:8080/api';
  
  console.log('🔄 Testing backend connection...');
  
  try {
    // Test 1: Basic health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE_URL}/health`);
    console.log(`   Health status: ${healthResponse.status}`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('   ✅ Health check passed:', healthData);
    } else {
      console.log('   ❌ Health check failed');
    }
  } catch (error) {
    console.log('   ❌ Health endpoint error:', error);
  }

  try {
    // Test 2: Test auth endpoints availability
    console.log('2. Testing auth endpoints availability...');
    const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword'
      }),
    });
    
    console.log(`   Auth endpoint status: ${loginResponse.status}`);
    if (loginResponse.status === 401 || loginResponse.status === 400) {
      console.log('   ✅ Auth endpoint is responsive (expected 401/400 for invalid credentials)');
    } else if (loginResponse.status === 200) {
      console.log('   ✅ Auth endpoint working (unexpected success - check your test data)');
    } else {
      console.log('   ❓ Unexpected auth response');
    }
  } catch (error) {
    console.log('   ❌ Auth endpoint error:', error);
  }

  try {
    // Test 3: Test dashboard endpoints (should require auth)
    console.log('3. Testing dashboard endpoints...');
    
    // Check if we have a valid token
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('authToken');
    
    if (token) {
      console.log('   🔑 Found auth token, testing authenticated request...');
      const dashboardResponse = await fetch(`${API_BASE_URL}/dashboard/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log(`   Dashboard with auth status: ${dashboardResponse.status}`);
      
      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        console.log('   ✅ Dashboard endpoint working with authentication:', dashboardData);
      } else if (dashboardResponse.status === 401) {
        console.log('   ⚠️ Token expired or invalid - please login again');
      } else {
        console.log('   ❌ Dashboard endpoint error:', dashboardResponse.status);
      }
    } else {
      console.log('   ⚠️ No auth token found - testing without authentication...');
      const dashboardResponse = await fetch(`${API_BASE_URL}/dashboard/stats`);
      console.log(`   Dashboard status: ${dashboardResponse.status}`);
      
      if (dashboardResponse.status === 401 || dashboardResponse.status === 403) {
        console.log('   ✅ Dashboard endpoint is protected (expected 401/403 without auth)');
      } else {
        console.log('   ❓ Dashboard endpoint response:', dashboardResponse.status);
      }
    }
  } catch (error) {
    console.log('   ❌ Dashboard endpoint error:', error);
  }

  try {
    // Test 4: Test CORS
    console.log('4. Testing CORS configuration...');
    const corsResponse = await fetch(`${API_BASE_URL}/health`, {
      method: 'OPTIONS',
    });
    console.log(`   CORS preflight status: ${corsResponse.status}`);
    
    const corsHeaders = corsResponse.headers.get('Access-Control-Allow-Origin');
    if (corsHeaders) {
      console.log('   ✅ CORS headers present:', corsHeaders);
    } else {
      console.log('   ❌ CORS headers missing');
    }
  } catch (error) {
    console.log('   ❌ CORS test error:', error);
  }

  console.log('🏁 Connection test completed!');
  console.log('');
  console.log('📋 Backend Setup Instructions:');
  console.log('1. Navigate to: C:\\Users\\Sameer\\Desktop\\Finance Tracker UI\\Finance\\finance-tracker');
  console.log('2. Set JAVA_HOME environment variable to your Java 21 installation');
  console.log('3. Run: .\\mvnw.cmd spring-boot:run');
  console.log('4. Backend should start on http://localhost:8080');
  console.log('5. Re-run this test to verify connection');
};

// Export a simple function to add to window for browser console testing
export const addConnectionTestToWindow = () => {
  if (typeof window !== 'undefined') {
    (window as any).testBackendConnection = testBackendConnection;
    (window as any).testLogin = testLogin;
    (window as any).checkAuth = checkAuth;
    console.log('🔧 Connection test functions added to window:');
    console.log('   - testBackendConnection() - Full connection test');
    console.log('   - testLogin(email, password) - Test login');
    console.log('   - checkAuth() - Check current authentication status');
  }
};

// Test login function
export const testLogin = async (email: string, password: string) => {
  const API_BASE_URL = 'http://localhost:8080/api';
  
  console.log('🔐 Testing login...');
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    console.log(`Login response status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Login successful:', data);
      if (data.token) {
        localStorage.setItem('jwt_token', data.token);
        localStorage.setItem('authToken', data.token);
        console.log('🔑 Token saved to localStorage');
      }
      return data;
    } else {
      const errorText = await response.text();
      console.log('❌ Login failed:', errorText);
    }
  } catch (error) {
    console.log('❌ Login error:', error);
  }
};

// Check authentication status
export const checkAuth = () => {
  const tokens = {
    jwt_token: localStorage.getItem('jwt_token'),
    authToken: localStorage.getItem('authToken'),
    token: localStorage.getItem('token'),
    access_token: localStorage.getItem('access_token')
  };
  
  console.log('🔍 Authentication status:', tokens);
  
  const hasValidToken = Object.values(tokens).some(token => token && token.length > 0);
  console.log(`Authentication: ${hasValidToken ? '✅ Token found' : '❌ No valid token'}`);
  
  return tokens;
};