import { jsPDF } from 'jspdf';

export interface SimpleTransaction {
  id: number;
  amount: number;
  description: string;
  type: 'INCOME' | 'EXPENSE';
  categoryName?: string;
  date: string;
}

export class SimplePDFExport {
  static exportToPDF(transactions: SimpleTransaction[], title: string = 'Transaction Report'): void {
    try {
      const doc = new jsPDF();
      let yPosition = 20;
      
      // Add title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(59, 130, 246); // Blue title
      doc.text(title, 20, yPosition);
      yPosition += 15;
      
      // Add date
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 100, 100); // Gray
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-IN')}`, 20, yPosition);
      yPosition += 25;
      
      // Financial Summary Section
      const incomeTransactions = transactions.filter(t => t.type === 'INCOME');
      const expenseTransactions = transactions.filter(t => t.type === 'EXPENSE');
      
      const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
      const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
      const netBalance = totalIncome - totalExpenses;
      
      // Calculations complete
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('FINANCIAL SUMMARY', 20, yPosition);
      yPosition += 12;
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      
      // Summary box background
      doc.setFillColor(248, 250, 252);
      doc.rect(20, yPosition - 5, 170, 30, 'F');
      
      doc.setTextColor(0, 128, 0); // Green
      doc.text(`Total Income: Rs.${totalIncome.toLocaleString('en-IN')}`, 25, yPosition + 5);
      
      doc.setTextColor(255, 0, 0); // Red
      doc.text(`Total Expenses: Rs.${totalExpenses.toLocaleString('en-IN')}`, 25, yPosition + 15);
      
      doc.setTextColor(netBalance >= 0 ? 0 : 255, netBalance >= 0 ? 128 : 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.text(`Net Balance: Rs.${netBalance.toLocaleString('en-IN')}`, 25, yPosition + 25);
      
      // Add note if no income transactions
      if (totalIncome === 0 && totalExpenses > 0) {
        yPosition += 35;
        doc.setFontSize(10);
        doc.setTextColor(255, 100, 0); // Orange warning
        doc.text('⚠ No income transactions found. Add income to see accurate balance.', 25, yPosition);
      }
      
      yPosition += 40;
      
      // Transaction Details Header
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      doc.text('TRANSACTION DETAILS', 20, yPosition);
      yPosition += 15;
      
      // Add table headers with better formatting
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(59, 130, 246); // Blue background
      doc.setTextColor(255, 255, 255); // White text
      doc.rect(20, yPosition, 170, 12, 'F'); // Header background
      
      doc.text('Date', 25, yPosition + 8);
      doc.text('Description', 58, yPosition + 8);
      doc.text('Category', 105, yPosition + 8);
      doc.text('Type', 140, yPosition + 8);
      doc.text('Amount', 165, yPosition + 8);
      
      yPosition += 18;
      doc.setTextColor(0, 0, 0); // Reset to black
      
      // Add transactions
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      transactions.forEach((transaction, index) => {
        if (yPosition > 270) { // Start new page if needed
          doc.addPage();
          yPosition = 20;
          
          // Repeat headers on new page
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.setFillColor(59, 130, 246);
          doc.setTextColor(255, 255, 255);
          doc.rect(20, yPosition, 170, 10, 'F');
          
          doc.text('Date', 25, yPosition + 7);
          doc.text('Description', 55, yPosition + 7);
          doc.text('Category', 100, yPosition + 7);
          doc.text('Type', 135, yPosition + 7);
          doc.text('Amount', 165, yPosition + 7);
          
          yPosition += 15;
          doc.setTextColor(0, 0, 0);
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');
        }
        
        // Alternate row colors for better readability
        if (index % 2 === 0) {
          doc.setFillColor(248, 250, 252); // Light gray
          doc.rect(20, yPosition - 2, 170, 14, 'F');
        }
        
        const date = new Date(transaction.date).toLocaleDateString('en-IN');
        const amount = transaction.type === 'INCOME' ? 
          `+Rs.${transaction.amount.toLocaleString('en-IN')}` : 
          `-Rs.${transaction.amount.toLocaleString('en-IN')}`;
        
        // Transaction data with improved spacing
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(0, 0, 0);
        doc.text(date, 25, yPosition + 6);
        doc.text(transaction.description.substring(0, 18), 58, yPosition + 6);
        doc.text((transaction.categoryName || 'Unknown').substring(0, 15), 105, yPosition + 6);
        
        // Type with color
        doc.setFont('helvetica', 'bold');
        if (transaction.type === 'INCOME') {
          doc.setTextColor(0, 128, 0); // Green
          doc.text('INCOME', 140, yPosition + 6);
        } else {
          doc.setTextColor(255, 100, 0); // Orange
          doc.text('EXPENSE', 140, yPosition + 6);
        }
        
        // Amount with color and better alignment
        if (transaction.type === 'INCOME') {
          doc.setTextColor(0, 128, 0); // Green
        } else {
          doc.setTextColor(255, 0, 0); // Red
        }
        doc.text(amount, 165, yPosition + 6);
        
        // Reset formatting
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        
        yPosition += 14;
      });
      
      // Add footer note if needed
      if (yPosition < 270) {
        yPosition = 280;
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Report generated by TrackMyFin - ${new Date().toLocaleDateString('en-IN')}`, 20, yPosition);
      }
      
      // Generate filename
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `TrackMyFin_Simple_Report_${dateStr}.pdf`;
      
      // Save file
      doc.save(filename);
      
    } catch (error) {
      console.error('Simple PDF export error:', error);
      throw error;
    }
  }
}