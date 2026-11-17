import { Router, Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validateBody, createInquirySchema } from '../middleware/validation.js';
import { recordAudit } from '../services/auditService.js';

export const inquiriesRouter = Router();

// POST /api/inquiries (Public: submit advertising or business partnership inquiry)
inquiriesRouter.post('/', validateBody(createInquirySchema), async (req: Request, res: Response) => {
  try {
    const { name, email, company, inquiryType, budget, message } = req.body;

    const inquiry = await prisma.businessInquiry.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        company: company.trim(),
        inquiryType: inquiryType.trim(),
        budget: budget ? budget.trim() : null,
        message: message.trim(),
        status: 'NEW'
      }
    });

    await recordAudit({
      action: 'BUSINESS_INQUIRY_SUBMITTED',
      actorEmail: inquiry.email,
      targetId: inquiry.id,
      targetType: 'INQUIRY',
      details: `Inquiry from ${company} for ${inquiryType}`
    });

    return res.status(201).json({
      success: true,
      inquiryId: inquiry.id,
      message: 'Thank you for contacting OPEN MEDIA Business Partnerships. Your inquiry has been received.',
      followUpExpectation: 'Our partnership team will review your brief and contact you within 1 business day.',
      inquiry
    });
  } catch (err: any) {
    console.error('Submit inquiry error:', err);
    return res.status(500).json({ error: 'Failed to submit business inquiry' });
  }
});

// GET /api/inquiries (Admin only: review all partnership and advertising inquiries)
inquiriesRouter.get('/', requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    const where: any = {};
    if (status && typeof status === 'string' && ['NEW', 'IN_REVIEW', 'CONTACTED', 'CLOSED'].includes(status)) {
      where.status = status;
    }

    const inquiries = await prisma.businessInquiry.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    const statusCounts = await prisma.businessInquiry.groupBy({
      by: ['status'],
      _count: true
    });

    return res.json({
      success: true,
      inquiries,
      counts: statusCounts.reduce((acc: any, curr) => {
        acc[curr.status] = curr._count;
        return acc;
      }, {})
    });
  } catch (err: any) {
    console.error('Get inquiries error:', err);
    return res.status(500).json({ error: 'Failed to fetch inquiries' });
  }
});

// PUT /api/inquiries/:id/status (Admin only: update inquiry status)
inquiriesRouter.put('/:id/status', requireRole(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['NEW', 'IN_REVIEW', 'CONTACTED', 'CLOSED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be NEW, IN_REVIEW, CONTACTED, or CLOSED' });
    }

    const inquiry = await prisma.businessInquiry.update({
      where: { id },
      data: { status }
    });

    await recordAudit({
      action: 'BUSINESS_INQUIRY_STATUS_UPDATED',
      actorId: req.user!.id,
      actorEmail: req.user!.email,
      actorRole: req.user!.role,
      targetId: id,
      targetType: 'INQUIRY',
      details: `Inquiry status changed to ${status}`
    });

    return res.json({
      success: true,
      message: `Inquiry status updated to ${status}`,
      inquiry
    });
  } catch (err: any) {
    console.error('Update inquiry status error:', err);
    return res.status(500).json({ error: 'Failed to update inquiry status' });
  }
});
