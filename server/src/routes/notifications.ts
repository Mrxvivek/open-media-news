import { Router, Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody, updateNotificationSettingsSchema } from '../middleware/validation.js';

export const notificationsRouter = Router();

notificationsRouter.use(requireAuth);

// GET /api/notifications (User: get notifications & unread count)
notificationsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50
      }),
      prisma.notification.count({
        where: { userId, isRead: false }
      })
    ]);

    return res.json({ notifications, unreadCount });
  } catch (err: any) {
    console.error('Get notifications error:', err);
    return res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// PATCH /api/notifications/:id/read (User: mark notification as read)
notificationsRouter.patch('/:id/read', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const updated = await prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true }
    });

    return res.json({ message: 'Notification marked as read', success: updated.count > 0 });
  } catch (err: any) {
    console.error('Mark notification read error:', err);
    return res.status(500).json({ error: 'Failed to update notification' });
  }
});

// POST /api/notifications/read-all (User: mark all notifications as read)
notificationsRouter.post('/read-all', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });

    return res.json({ message: 'All notifications marked as read', count: result.count });
  } catch (err: any) {
    console.error('Mark all notifications read error:', err);
    return res.status(500).json({ error: 'Failed to update notifications' });
  }
});

// GET /api/notifications/settings (User: get notification settings)
notificationsRouter.get('/settings', async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    let settings = await prisma.notificationSetting.findUnique({
      where: { userId }
    });

    if (!settings) {
      settings = await prisma.notificationSetting.create({
        data: { userId }
      });
    }

    return res.json({ settings });
  } catch (err: any) {
    console.error('Get notification settings error:', err);
    return res.status(500).json({ error: 'Failed to fetch notification settings' });
  }
});

// PUT /api/notifications/settings (User: update notification settings)
notificationsRouter.put('/settings', validateBody(updateNotificationSettingsSchema), async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { breakingNews, commentReplies, discussionReplies, topicUpdates } = req.body;

    const data: any = {};
    if (breakingNews !== undefined) data.breakingNews = Boolean(breakingNews);
    if (commentReplies !== undefined) data.commentReplies = Boolean(commentReplies);
    if (discussionReplies !== undefined) data.discussionReplies = Boolean(discussionReplies);
    if (topicUpdates !== undefined) data.topicUpdates = Boolean(topicUpdates);

    const settings = await prisma.notificationSetting.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data }
    });

    return res.json({ message: 'Notification preferences updated', settings });
  } catch (err: any) {
    console.error('Update notification settings error:', err);
    return res.status(500).json({ error: 'Failed to update settings' });
  }
});
