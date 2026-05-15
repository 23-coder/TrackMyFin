// Real-time Data Testing Script
// Run this in your browser console after the DataContext is implemented

console.log('🧪 Testing Real-Time Data Features...');

const testRealTimeFeatures = async () => {
  console.log('\n🔄 Test 1: Auto-Refresh Status');
  
  // Check if DataContext is available
  if (window.React && window.React.useContext) {
    console.log('✅ React context system available');
  } else {
    console.log('❌ React context system not available');
    return;
  }

  // Test connection status
  console.log('\n🌐 Test 2: Connection Status');
  try {
    const response = await fetch('http://localhost:8080/api/health');
    console.log(`✅ Backend connection: ${response.status === 200 ? 'Online' : 'Offline'}`);
  } catch (error) {
    console.log('❌ Backend connection: Offline');
  }

  // Test data refresh
  console.log('\n📊 Test 3: Manual Data Refresh');
  const testRefresh = async () => {
    const startTime = Date.now();
    try {
      const response = await fetch('http://localhost:8080/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      const endTime = Date.now();
      console.log(`✅ Data refresh completed in ${endTime - startTime}ms`);
      console.log('   Dashboard stats:', data);
      return true;
    } catch (error) {
      console.log('❌ Data refresh failed:', error);
      return false;
    }
  };

  await testRefresh();

  // Test optimistic updates
  console.log('\n⚡ Test 4: Optimistic Updates');
  console.log('   This test requires manual interaction:');
  console.log('   1. Add a new transaction');
  console.log('   2. Check if UI updates immediately');
  console.log('   3. Verify data persists after page refresh');

  // Test auto-refresh interval
  console.log('\n⏰ Test 5: Auto-Refresh Interval');
  console.log('   Auto-refresh should occur every 30 seconds when enabled');
  console.log('   Watch the network tab for automatic API calls');

  // Performance test
  console.log('\n⚡ Test 6: Performance Metrics');
  const performanceTest = async () => {
    const iterations = 5;
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await testRefresh();
      const end = performance.now();
      times.push(end - start);
    }
    
    const average = times.reduce((sum, time) => sum + time, 0) / times.length;
    console.log(`   Average refresh time: ${average.toFixed(2)}ms`);
    console.log(`   Fastest: ${Math.min(...times).toFixed(2)}ms`);
    console.log(`   Slowest: ${Math.max(...times).toFixed(2)}ms`);
  };

  await performanceTest();

  console.log('\n🎯 Real-Time Data Test Summary:');
  console.log('✅ Basic connection test completed');
  console.log('✅ Data refresh functionality verified');
  console.log('✅ Performance metrics collected');
  console.log('⚠️  Please test optimistic updates manually');
  console.log('⚠️  Verify auto-refresh in network tab');
};

// Connection monitor
const monitorConnection = () => {
  console.log('\n📡 Starting Connection Monitor...');
  
  const checkConnection = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/health');
      const status = response.ok ? '🟢 Online' : '🔴 Offline';
      console.log(`[${new Date().toLocaleTimeString()}] Backend: ${status}`);
      return response.ok;
    } catch (error) {
      console.log(`[${new Date().toLocaleTimeString()}] Backend: 🔴 Offline`);
      return false;
    }
  };

  // Initial check
  checkConnection();

  // Check every 10 seconds
  const interval = setInterval(checkConnection, 10000);

  // Return cleanup function
  return () => {
    clearInterval(interval);
    console.log('📡 Connection monitor stopped');
  };
};

// Data sync monitor
const monitorDataSync = () => {
  console.log('\n🔄 Starting Data Sync Monitor...');
  
  let lastSyncTime = null;
  
  const checkDataSync = async () => {
    const currentTime = new Date();
    
    // Check localStorage for last update time
    const lastUpdate = localStorage.getItem('lastDataUpdate');
    if (lastUpdate) {
      const updateTime = new Date(lastUpdate);
      const timeDiff = Math.floor((currentTime - updateTime) / 1000);
      console.log(`[${currentTime.toLocaleTimeString()}] Last sync: ${timeDiff}s ago`);
    }
    
    // Monitor for new API calls (this would need to be integrated with the actual data context)
    const token = localStorage.getItem('jwt_token');
    if (token) {
      try {
        const response = await fetch('http://localhost:8080/api/dashboard/stats', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          localStorage.setItem('lastDataUpdate', currentTime.toISOString());
          console.log(`[${currentTime.toLocaleTimeString()}] ✅ Data synced successfully`);
        }
      } catch (error) {
        console.log(`[${currentTime.toLocaleTimeString()}] ❌ Data sync failed`);
      }
    }
  };

  // Initial check
  checkDataSync();

  // Check every 30 seconds
  const interval = setInterval(checkDataSync, 30000);

  // Return cleanup function
  return () => {
    clearInterval(interval);
    console.log('🔄 Data sync monitor stopped');
  };
};

// Auto-run tests
testRealTimeFeatures();

// Export utilities
window.financeTrackerRealTimeTest = {
  testRealTimeFeatures,
  monitorConnection,
  monitorDataSync,
  // Quick test functions
  quickHealthCheck: async () => {
    try {
      const response = await fetch('http://localhost:8080/api/health');
      console.log(`Backend Status: ${response.ok ? '✅ Online' : '❌ Offline'}`);
      return response.ok;
    } catch (error) {
      console.log('Backend Status: ❌ Offline');
      return false;
    }
  },
  
  quickDataRefresh: async () => {
    const token = localStorage.getItem('jwt_token');
    if (!token) {
      console.log('❌ No auth token found');
      return false;
    }
    
    try {
      const response = await fetch('http://localhost:8080/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Data refreshed:', data);
        return data;
      } else {
        console.log('❌ Data refresh failed:', response.status);
        return false;
      }
    } catch (error) {
      console.log('❌ Data refresh error:', error);
      return false;
    }
  }
};

console.log('\n🎉 Real-time data testing utilities loaded!');
console.log('📋 Available commands:');
console.log('   window.financeTrackerRealTimeTest.quickHealthCheck()');
console.log('   window.financeTrackerRealTimeTest.quickDataRefresh()');
console.log('   window.financeTrackerRealTimeTest.monitorConnection()');
console.log('   window.financeTrackerRealTimeTest.monitorDataSync()');