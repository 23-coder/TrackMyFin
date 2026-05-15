// Test utility to debug API issues
const testBackendConnection = async () => {
  console.log('Testing backend connection...');
  
  try {
    // Test basic connectivity
    const response = await fetch('http://localhost:8080/api/auth/register', {
      method: 'OPTIONS',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    console.log('OPTIONS request response:', {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries())
    });
  } catch (error) {
    console.error('OPTIONS request failed:', error);
  }

  // Test with minimal data
  try {
    const testData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'testpassword123'
    };

    console.log('Testing with data:', testData);

    const response = await fetch('http://localhost:8080/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(testData),
    });

    console.log('POST response status:', response.status);
    
    const responseText = await response.text();
    console.log('POST response body:', responseText);

    if (response.headers.get('content-type')?.includes('application/json')) {
      try {
        const jsonResponse = JSON.parse(responseText);
        console.log('Parsed JSON response:', jsonResponse);
      } catch (e) {
        console.log('Response is not valid JSON');
      }
    }

  } catch (error) {
    console.error('POST request failed:', error);
  }
};

// Make this available globally for testing
(window as any).testBackendConnection = testBackendConnection;

export default testBackendConnection;