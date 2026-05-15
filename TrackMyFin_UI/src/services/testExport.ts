import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Simple test function to verify PDF export works
export const testPDFExport = () => {
  try {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text('Test PDF Export', 20, 20);
    
    // Test if autoTable is available
    if (typeof (doc as any).autoTable === 'function') {
      console.log('✅ autoTable is available');
      
      // Simple test table
      (doc as any).autoTable({
        head: [['Name', 'Amount', 'Type']],
        body: [
          ['Test Transaction 1', '₹1000', 'INCOME'],
          ['Test Transaction 2', '₹500', 'EXPENSE'],
        ],
        startY: 30,
      });
      
      doc.save('test-export.pdf');
      console.log('✅ PDF export successful');
      return true;
    } else {
      console.error('❌ autoTable is not available');
      return false;
    }
  } catch (error) {
    console.error('❌ PDF export failed:', error);
    return false;
  }
};