// Comprehensive system test for Finance Tracker
export const runSystemTest = async () => {
  console.log('🚀 Starting comprehensive system test...');
  
  const results = {
    frontend: { status: 'unknown', issues: [] },
    backend: { status: 'unknown', issues: [] },
    database: { status: 'unknown', issues: [] },
    authentication: { status: 'unknown', issues: [] },
    crud: { status: 'unknown', issues: [] }
  } as any;

  try {
    // Test 1: Frontend Status
    console.log('🔍 Testing Frontend...');
    const frontendErrors = document.querySelectorAll('.error, .alert-error, .bg-red-50');
    if (frontendErrors.length === 0) {
      results.frontend.status = 'healthy';
      console.log('✅ Frontend: No error messages visible');
    } else {
      results.frontend.status = 'warning';
      results.frontend.issues.push(`${frontendErrors.length} error messages on UI`);
      console.log('⚠️ Frontend: Found error messages on UI');
    }

    // Test 2: Backend Health
    console.log('🔍 Testing Backend Health...');
    try {
      const healthResponse = await fetch('http://localhost:8080/api/health');
      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        results.backend.status = 'healthy';
        console.log('✅ Backend: Health endpoint responding', healthData);
      } else {
        results.backend.status = 'error';
        results.backend.issues.push(`Health endpoint returned ${healthResponse.status}`);
        console.log('❌ Backend: Health endpoint failed');
      }
    } catch (error) {
      results.backend.status = 'error';
      results.backend.issues.push('Health endpoint unreachable');
      console.log('❌ Backend: Health endpoint unreachable', error);
    }

    // Test 3: Authentication
    console.log('🔍 Testing Authentication...');
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('authToken') || localStorage.getItem('token');
    
    if (token) {
      try {
        const authTestResponse = await fetch('http://localhost:8080/api/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (authTestResponse.ok) {
          results.authentication.status = 'healthy';
          console.log('✅ Authentication: Token valid and working');
        } else if (authTestResponse.status === 401) {
          results.authentication.status = 'warning';
          results.authentication.issues.push('Token expired or invalid');
          console.log('⚠️ Authentication: Token needs refresh');
        } else {
          results.authentication.status = 'error';
          results.authentication.issues.push(`Unexpected response: ${authTestResponse.status}`);
          console.log('❌ Authentication: Unexpected response');
        }
      } catch (error) {
        results.authentication.status = 'error';
        results.authentication.issues.push('Auth test failed');
        console.log('❌ Authentication: Test failed', error);
      }
    } else {
      results.authentication.status = 'warning';
      results.authentication.issues.push('No authentication token found');
      console.log('⚠️ Authentication: No token found - user needs to login');
    }

    // Test 4: Data Connectivity
    console.log('🔍 Testing Data Connectivity...');
    try {
      const categoriesResponse = await fetch('http://localhost:8080/api/categories', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        results.database.status = 'healthy';
        console.log('✅ Database: Categories loaded successfully', categoriesData.length, 'categories found');
      } else {
        results.database.status = 'warning';
        results.database.issues.push(`Categories endpoint returned ${categoriesResponse.status}`);
        console.log('⚠️ Database: Categories endpoint issue');
      }
    } catch (error) {
      results.database.status = 'error';
      results.database.issues.push('Database connectivity failed');
      console.log('❌ Database: Connectivity failed', error);
    }

    // Test 5: CRUD Operations (basic read test)
    console.log('🔍 Testing CRUD Operations...');
    try {
      const transactionsResponse = await fetch('http://localhost:8080/api/transactions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (transactionsResponse.ok) {
        const transactionsData = await transactionsResponse.json();
        results.crud.status = 'healthy';
        console.log('✅ CRUD: Transactions loaded successfully', transactionsData.length, 'transactions found');
      } else {
        results.crud.status = 'warning';
        results.crud.issues.push(`Transactions endpoint returned ${transactionsResponse.status}`);
        console.log('⚠️ CRUD: Transactions endpoint issue');
      }
    } catch (error) {
      results.crud.status = 'error';
      results.crud.issues.push('CRUD operations failed');
      console.log('❌ CRUD: Operations failed', error);
    }

  } catch (globalError) {
    console.error('❌ Global system test error:', globalError);
  }

  // Generate summary
  console.log('\n📊 System Test Results Summary:');
  console.log('================================');
  
  const statusIcon = (status: string) => {
    switch(status) {
      case 'healthy': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '❓';
    }
  };

  Object.entries(results).forEach(([component, result]: [string, any]) => {
    console.log(`${statusIcon(result.status)} ${component.toUpperCase()}: ${result.status}`);
    if (result.issues.length > 0) {
      result.issues.forEach((issue: string) => {
        console.log(`   - ${issue}`);
      });
    }
  });

  const overallHealth = Object.values(results).every((r: any) => r.status === 'healthy') ? 'EXCELLENT' :
                       Object.values(results).some((r: any) => r.status === 'error') ? 'NEEDS_ATTENTION' : 'GOOD';

  console.log(`\n🎯 Overall System Health: ${overallHealth}`);
  
  if (overallHealth === 'EXCELLENT') {
    console.log('🎉 All systems are working perfectly!');
  } else if (overallHealth === 'GOOD') {
    console.log('👍 System is working well with minor warnings');
  } else {
    console.log('🔧 System needs attention to resolve errors');
  }

  return results;
};

// Auto-run test when imported
console.log('System test utility loaded. Run runSystemTest() to execute comprehensive test.');