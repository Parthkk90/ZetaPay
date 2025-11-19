import { AppDataSource } from '../db/connection';
import { Invoice, InvoiceStatus, InvoiceItem } from '../models/Invoice';
import logger from '../utils/logger';

class InvoiceService {
  /**
   * Generate invoice number
   */
  private async generateInvoiceNumber(merchantId: string): Promise<string> {
    const repo = AppDataSource.getRepository(Invoice);
    const count = await repo.count({ where: { merchantId } });
    const year = new Date().getFullYear();
    return `INV-${year}-${String(count + 1).padStart(6, '0')}`;
  }

  /**
   * Create invoice
   */
  async createInvoice(data: {
    merchantId: string;
    customerId: string;
    customerEmail: string;
    customerName?: string;
    customerAddress?: string;
    items: InvoiceItem[];
    currency: string;
    tax?: number;
    discount?: number;
    dueInDays?: number;
    notes?: string;
    terms?: string;
    metadata?: Record<string, any>;
  }): Promise<Invoice> {
    const repo = AppDataSource.getRepository(Invoice);

    const subtotal = data.items.reduce((sum, item) => sum + item.amount, 0);
    const tax = data.tax || 0;
    const discount = data.discount || 0;
    const total = subtotal + tax - discount;

    const issueDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + (data.dueInDays || 30));

    const invoiceNumber = await this.generateInvoiceNumber(data.merchantId);

    const invoice = repo.create({
      invoiceNumber,
      merchantId: data.merchantId,
      customerId: data.customerId,
      customerEmail: data.customerEmail,
      customerName: data.customerName,
      customerAddress: data.customerAddress,
      items: data.items,
      subtotal,
      tax,
      discount,
      total,
      currency: data.currency,
      status: InvoiceStatus.OPEN,
      issueDate,
      dueDate,
      notes: data.notes,
      terms: data.terms,
      metadata: data.metadata,
    });

    await repo.save(invoice);
    logger.info(`Invoice created: ${invoice.invoiceNumber}`);

    return invoice;
  }

  /**
   * Mark invoice as paid
   */
  async markAsPaid(invoiceId: string): Promise<Invoice> {
    const repo = AppDataSource.getRepository(Invoice);
    const invoice = await repo.findOne({ where: { id: invoiceId } });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    invoice.status = InvoiceStatus.PAID;
    invoice.paidAt = new Date();

    await repo.save(invoice);
    logger.info(`Invoice marked as paid: ${invoice.invoiceNumber}`);

    return invoice;
  }

  /**
   * Get merchant invoices
   */
  async getMerchantInvoices(
    merchantId: string,
    status?: InvoiceStatus
  ): Promise<Invoice[]> {
    const repo = AppDataSource.getRepository(Invoice);
    const where: any = { merchantId };
    if (status) where.status = status;

    return repo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Generate PDF (placeholder)
   */
  async generatePDF(invoiceId: string): Promise<Buffer> {
    // In production, use a PDF generation library like puppeteer or pdfkit
    logger.info(`PDF generation requested for invoice ${invoiceId}`);
    return Buffer.from('PDF placeholder');
  }
}

export const invoiceService = new InvoiceService();
export { InvoiceService };
