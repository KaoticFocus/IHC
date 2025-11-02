export interface ExportOptions {
  format: 'pdf' | 'csv' | 'txt' | 'json';
  filename?: string;
}

export class ExportService {
  /**
   * Export data as CSV
   */
  static exportToCSV<T extends Record<string, any>>(
    data: T[],
    filename: string = 'export.csv'
  ): void {
    if (data.length === 0) {
      throw new Error('No data to export');
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            return typeof value === 'string' && value.includes(',')
              ? `"${value.replace(/"/g, '""')}"`
              : value ?? '';
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  /**
   * Export data as JSON
   */
  static exportToJSON<T>(data: T, filename: string = 'export.json'): void {
    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  /**
   * Export text as TXT
   */
  static exportToTXT(content: string, filename: string = 'export.txt'): void {
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  /**
   * Export leads as CSV
   */
  static exportLeads(leads: any[], filename?: string): void {
    this.exportToCSV(leads, filename || `leads_${Date.now()}.csv`);
  }

  /**
   * Export transcript as TXT
   */
  static exportTranscript(transcript: string, filename?: string): void {
    this.exportToTXT(transcript, filename || `transcript_${Date.now()}.txt`);
  }

  /**
   * Export scope of work as JSON
   */
  static exportScopeOfWork(scopeOfWork: any, filename?: string): void {
    this.exportToJSON(scopeOfWork, filename || `scope_of_work_${Date.now()}.json`);
  }

  /**
   * Generate PDF content (simplified - would use jsPDF in production)
   */
  static async exportToPDF(content: string, filename: string = 'export.pdf'): Promise<void> {
    // For now, export as HTML that can be printed to PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${filename}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              pre { white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <pre>${content}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  }
}

