import * as XLSX from 'xlsx';

export interface ExcelTransaction {
  id: number;
  amount: number;
  description: string;
  type: 'INCOME' | 'EXPENSE';
  categoryName?: string;
  date: string;
}

export class SimpleExcelExport {
  static exportToExcel(transactions: ExcelTransaction[], title: string = 'Transaction Report'): void {
    try {
      // Calculate summary
      const incomeTransactions = transactions.filter(t => t.type === 'INCOME');
      const expenseTransactions = transactions.filter(t => t.type === 'EXPENSE');
      
      const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
      const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      const netBalance = totalIncome - totalExpenses;
      
      // Create worksheet data
      const worksheetData = [];
      
      // Title and date
      worksheetData.push([title]);
      worksheetData.push([`Generated on: ${new Date().toLocaleDateString()}`]);
      worksheetData.push(['']); // Empty row
      
      // Summary section
      worksheetData.push(['FINANCIAL SUMMARY']);
      worksheetData.push(['Total Income:', `Rs.${totalIncome.toLocaleString('en-IN')}`]);
      worksheetData.push(['Total Expenses:', `Rs.${totalExpenses.toLocaleString('en-IN')}`]);
      worksheetData.push(['Net Balance:', `Rs.${netBalance.toLocaleString('en-IN')}`]);
      worksheetData.push(['']); // Empty row
      
      // Add note if no income transactions
      if (totalIncome === 0 && totalExpenses > 0) {
        worksheetData.push(['NOTE: No income transactions found in the selected data.']);
        worksheetData.push(['Add income transactions to see accurate financial summary.']);
        worksheetData.push(['']); // Empty row
      }
      
      // Transaction details header
      worksheetData.push(['TRANSACTION DETAILS']);
      worksheetData.push(['']); // Empty row
      
      // Column headers
      worksheetData.push(['Date', 'Description', 'Category', 'Type', 'Amount']);
      
      // Transaction data
      transactions.forEach(transaction => {
        const formattedAmount = transaction.type === 'INCOME' ? 
          `Rs.${transaction.amount.toLocaleString('en-IN')}` : 
          `-Rs.${transaction.amount.toLocaleString('en-IN')}`;
        
        worksheetData.push([
          new Date(transaction.date).toLocaleDateString(),
          transaction.description,
          transaction.categoryName || 'Unknown',
          transaction.type,
          formattedAmount
        ]);
      });
      
      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // Set column widths
      worksheet['!cols'] = [
        { wch: 12 },  // Date
        { wch: 30 },  // Description
        { wch: 18 },  // Category
        { wch: 10 },  // Type
        { wch: 15 },  // Amount
      ];
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
      
      // Generate filename
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `TrackMyFin_Excel_Report_${dateStr}.xlsx`;
      
      // Save file
      XLSX.writeFile(workbook, filename);
      
    } catch (error) {
      console.error('Simple Excel export error:', error);
      throw error;
    }
  }
}