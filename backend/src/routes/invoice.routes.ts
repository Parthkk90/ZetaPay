import { Router, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, AuthRequest } from '../middleware/auth';
import { invoiceService } from '../services/invoice.service';

const router = Router();

/**
 * POST /api/v1/invoices
 */
router.post(
  '/',
  authenticate,
  [
    body('customerId').isString().notEmpty(),
    body('customerEmail').isEmail(),
    body('items').isArray({ min: 1 }),
    body('currency').isString().isLength({ min: 3, max: 4 }),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const merchantId = req.merchant!.id;
      const invoice = await invoiceService.createInvoice({
        merchantId,
        ...req.body,
      });

      res.status(201).json({ success: true, data: invoice });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/v1/invoices
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const merchantId = req.merchant!.id;
    const { status } = req.query;
    
    const invoices = await invoiceService.getMerchantInvoices(
      merchantId,
      status as any
    );

    res.json({ success: true, data: invoices });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/invoices/:id/mark-paid
 */
router.post('/:id/mark-paid', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const invoice = await invoiceService.markAsPaid(id);

    res.json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/invoices/:id/pdf
 */
router.get('/:id/pdf', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const pdf = await invoiceService.generatePDF(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${id}.pdf`);
    res.send(pdf);
  } catch (error) {
    next(error);
  }
});

export default router;
