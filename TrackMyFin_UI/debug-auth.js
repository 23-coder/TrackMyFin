// Debug script to check authentication
// Open browser console and run this to debug

console.log('=== Authentication Debug ===');
console.log('JWT Token:', localStorage.getItem('jwt_token'));
console.log('Auth Token:', localStorage.getItem('authToken'));
console.log('Token:', localStorage.getItem('token'));
console.log('All localStorage keys:', Object.keys(localStorage));

// Test the API call directly
const testAPI = async () => {
  try {
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('authToken') || localStorage.getItem('token');
    console.log('Using token:', token);
    
    const response = await fetch('http://localhost:8080/api/categories', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('Success! Categories:', data);
    } else {
      const errorText = await response.text();
      console.log('Error response:', errorText);
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
};

// Run the test
testAPI();