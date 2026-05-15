import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF interface to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => void;
  }
}

export interface Transaction {
  id: number;
  amount: number;
  description: string;
  type: 'INCOME' | 'EXPENSE';
  categoryId: number;
  categoryName?: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExportFilters {
  dateFrom?: string;
  dateTo?: string;
  type?: 'ALL' | 'INCOME' | 'EXPENSE';
  categoryIds?: number[];
  minAmount?: number;
  maxAmount?: number;
}

export interface ExportOptions {
  includeFields: {
    date: boolean;
    description: boolean;
    amount: boolean;
    type: boolean;
    category: boolean;
    id: boolean;
  };
  format: 'excel' | 'pdf';
  filters: ExportFilters;
  title?: string;
}

export class TransactionExportService {
  
  /**
   * Filter transactions based on user criteria
   */
  private static filterTransactions(transactions: Transaction[], filters: ExportFilters): Transaction[] {
    return transactions.filter(transaction => {
      // Date range filter
      if (filters.dateFrom && new Date(transaction.date) < new Date(filters.dateFrom)) {
        return false;
      }
      if (filters.dateTo && new Date(transaction.date) > new Date(filters.dateTo)) {
        return false;
      }
      
      // Type filter
      if (filters.type && filters.type !== 'ALL' && transaction.type !== filters.type) {
        return false;
      }
      
      // Category filter
      if (filters.categoryIds && filters.categoryIds.length > 0 && 
          !filters.categoryIds.includes(transaction.categoryId)) {
        return false;
      }
      
      // Amount range filter
      if (filters.minAmount !== undefined && transaction.amount < filters.minAmount) {
        return false;
      }
      if (filters.maxAmount !== undefined && transaction.amount > filters.maxAmount) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Prepare data for export based on selected fields
   */
  private static prepareExportData(transactions: Transaction[], options: ExportOptions) {
    const filteredTransactions = this.filterTransactions(transactions, options.filters);
    
    return filteredTransactions.map(transaction => {
      const row: any = {};
      
      if (options.includeFields.id) {
        row['ID'] = transaction.id;
      }
      if (options.includeFields.date) {
        row['Date'] = new Date(transaction.date).toLocaleDateString();
      }
      if (options.includeFields.description) {
        row['Description'] = transaction.description;
      }
      if (options.includeFields.type) {
        row['Type'] = transaction.type;
      }
      if (options.includeFields.category) {
        row['Category'] = transaction.categoryName || 'Unknown';
      }
      if (options.includeFields.amount) {
        row['Amount'] = transaction.type === 'INCOME' ? 
          `₹${transaction.amount.toLocaleString()}` : 
          `-₹${transaction.amount.toLocaleString()}`;
      }
      
      return row;
    });
  }

  /**
   * Export transactions to Excel format
   */
  static exportToExcel(transactions: Transaction[], options: ExportOptions): void {
    try {
      const data = this.prepareExportData(transactions, options);
      
      if (data.length === 0) {
        throw new Error('No transactions found matching the selected criteria');
      }

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      
      // Calculate summary from original transactions
      const filteredTransactions = this.filterTransactions(transactions, options.filters);
      const totalIncome = filteredTransactions
        .filter((t: Transaction) => t.type === 'INCOME')
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
      
      const totalExpenses = filteredTransactions
        .filter((t: Transaction) => t.type === 'EXPENSE')
        .reduce((sum: number, t: Transaction) => sum + t.amount, 0);
      
      const netBalance = totalIncome - totalExpenses;
      
      // Create worksheet with structured data
      const worksheetData = [];
      
      // Add title
      if (options.title) {
        worksheetData.push([options.title]);
        worksheetData.push(['Generated on: ' + new Date().toLocaleDateString()]);
        worksheetData.push(['']); // Empty row
      }
      
      // Add summary section
      worksheetData.push(['FINANCIAL SUMMARY']);
      worksheetData.push(['Total Income:', '₹' + totalIncome.toLocaleString()]);
      worksheetData.push(['Total Expenses:', '₹' + totalExpenses.toLocaleString()]);
      worksheetData.push(['Net Balance:', '₹' + netBalance.toLocaleString()]);
      worksheetData.push(['']); // Empty row
      worksheetData.push(['TRANSACTION DETAILS']);
      worksheetData.push(['']); // Empty row
      
      // Add headers
      const headers = Object.keys(data[0] || {});
      worksheetData.push(headers);
      
      // Add transaction data
      data.forEach(row => {
        worksheetData.push(headers.map(header => row[header]));
      });
      
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      
      // Set column widths
      const columnWidths = [
        { wch: 8 },   // ID
        { wch: 12 },  // Date
        { wch: 35 },  // Description
        { wch: 12 },  // Type
        { wch: 18 },  // Category
        { wch: 15 },  // Amount
      ];
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

      // Generate filename
      const dateRange = options.filters.dateFrom && options.filters.dateTo 
        ? `_${options.filters.dateFrom}_to_${options.filters.dateTo}`
        : `_${new Date().toISOString().split('T')[0]}`;
      const filename = `TrackMyFin_Transactions${dateRange}.xlsx`;

      // Save file
      XLSX.writeFile(workbook, filename);
      
    } catch (error) {
      console.error('Excel export error:', error);
      throw error;
    }
  }

  /**
   * Export transactions to PDF format
   */
  static exportToPDF(transactions: Transaction[], options: ExportOptions): void {
    try {
      const data = this.prepareExportData(transactions, options);
      
      if (data.length === 0) {
        throw new Error('No transactions found matching the selected criteria');
      }

      // Create PDF document
      const doc = new jsPDF();
      
      // Check if autoTable is available
      if (typeof (doc as any).autoTable !== 'function') {
        throw new Error('PDF table functionality is not available. Please refresh the page and try again.');
      }
      
      // Add title
      const title = options.title || 'TrackMyFin - Transaction Report';
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(title, 20, 20);

      // Add date range if specified
      if (options.filters.dateFrom || options.filters.dateTo) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        const dateText = `Period: ${options.filters.dateFrom || 'Beginning'} to ${options.filters.dateTo || 'Now'}`;
        doc.text(dateText, 20, 30);
      }

      // Prepare table headers and data
      const headers = Object.keys(data[0] || {});
      const rows = data.map(row => headers.map(header => row[header]));

      // Calculate summary
      const totalIncome = data
        .filter(row => row['Type'] === 'INCOME')
        .reduce((sum, row) => sum + Math.abs(row['Amount'] || 0), 0);
      
      const totalExpenses = data
        .filter(row => row['Type'] === 'EXPENSE')
        .reduce((sum, row) => sum + Math.abs(row['Amount'] || 0), 0);
      
      const netBalance = totalIncome - totalExpenses;

      // Add table
      (doc as any).autoTable({
        head: [headers],
        body: rows,
        startY: options.filters.dateFrom || options.filters.dateTo ? 40 : 30,
        styles: {
          cellPadding: 3,
          fontSize: 10,
          valign: 'middle',
        },
        headStyles: {
          fillColor: [59, 130, 246], // Blue color
          textColor: 255,
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252], // Light gray
        },
        columnStyles: {
          [headers.indexOf('Amount')]: { halign: 'right' },
          [headers.indexOf('Type')]: { halign: 'center' },
        },
      });

      // Add summary section
      const finalY = (doc as any).lastAutoTable?.finalY || 150;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Summary', 20, finalY);

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Total Income: ₹${totalIncome.toLocaleString()}`, 20, finalY + 10);
      doc.text(`Total Expenses: ₹${totalExpenses.toLocaleString()}`, 20, finalY + 20);
      
      doc.setFont('helvetica', 'bold');
      const balanceColor = netBalance >= 0 ? [34, 197, 94] : [239, 68, 68]; // Green or Red
      doc.setTextColor(balanceColor[0], balanceColor[1], balanceColor[2]);
      doc.text(`Net Balance: ₹${netBalance.toLocaleString()}`, 20, finalY + 30);

      // Add footer
      const pageCount = doc.getNumberOfPages();
      doc.setTextColor(128, 128, 128);
      doc.setFontSize(8);
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(
          `Generated on ${new Date().toLocaleDateString()} | Page ${i} of ${pageCount} | TrackMyFin`,
          20,
          doc.internal.pageSize.height - 10
        );
      }

      // Generate filename
      const dateRange = options.filters.dateFrom && options.filters.dateTo 
        ? `_${options.filters.dateFrom}_to_${options.filters.dateTo}`
        : `_${new Date().toISOString().split('T')[0]}`;
      const filename = `TrackMyFin_Transactions${dateRange}.pdf`;

      // Save file
      doc.save(filename);
      
    } catch (error) {
      console.error('PDF export error:', error);
      throw error;
    }
  }

  /**
   * Main export function
   */
  static exportTransactions(transactions: Transaction[], options: ExportOptions): void {
    if (options.format === 'excel') {
      this.exportToExcel(transactions, options);
    } else if (options.format === 'pdf') {
      this.exportToPDF(transactions, options);
    } else {
      throw new Error('Unsupported export format');
    }
  }
}