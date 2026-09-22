import { Router, Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { validateBody, createEventSchema, updateEventStatusSchema } from '../middleware/validation.js';
import { emitRealtime } from '../index.js';

export const eventsRouter = Router();

// Public: list published events
eventsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const events = await prisma.event.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: { eventDate: 'asc' },
      include: {
        organizer: { select: { id: true, name: true, email: true, role: true } }
      }
    });

    return res.json({ events });
  } catch (err: any) {
    console.error('List events error:', err);
    return res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Authenticated user / publisher creates event submission
eventsRouter.post('/', requireRole(['PUBLISHER', 'ADMIN']), validateBody(createEventSchema), async (req: Request, res: Response) => {
  try {
    const { title, description, category, location, eventDate, imageUrl, organizerId } = req.body;

    const organizerIdValue = (req.user!.role === 'ADMIN' && organizerId) ? organizerId : req.user!.id;
    const event = await prisma.event.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        location: location.trim(),
        eventDate: new Date(eventDate),
        imageUrl: imageUrl?.trim() || null,
        organizerId: organizerIdValue,
        status: 'PENDING'
      },
      include: { organizer: { select: { id: true, name: true, email: true, role: true } } }
    });

    emitRealtime('event:submitted', {
      id: event.id,
      title: event.title,
      organizer: event.organizer,
      event: event
    });

    return res.status(201).json({
      message: 'Event submitted for review',
      event
    });
  } catch (err: any) {
    console.error('Create event error:', err);
    return res.status(500).json({ error: 'Failed to create event' });
  }
});

// Publisher-specific list
eventsRouter.get('/mine', requireRole(['PUBLISHER', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const events = await prisma.event.findMany({
      where: { organizerId: req.user!.id },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ events });
  } catch (err: any) {
    console.error('Get my events error:', err);
    return res.status(500).json({ error: 'Failed to fetch your events' });
  }
});

// Admin status update for events
eventsRouter.patch('/:id/status', requireRole(['ADMIN']), validateBody(updateEventStatusSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.event.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const updated = await prisma.event.update({
      where: { id },
      data: {
        status: req.body.status,
        ...(req.body.editorialFeedback ? { description: `${existing.description}\n\nEditorial feedback: ${req.body.editorialFeedback}` } : {})
      },
      include: { organizer: { select: { id: true, name: true, email: true, role: true } } }
    });

    emitRealtime('event:status_changed', {
      id: updated.id,
      status: updated.status,
      title: updated.title,
      event: updated
    });

    return res.json({ message: `Event status updated to ${updated.status}`, event: updated });
  } catch (err: any) {
    console.error('Update event status error:', err);
    return res.status(500).json({ error: 'Failed to update event status' });
  }
});
