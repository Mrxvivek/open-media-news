import { Router, Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody, createPollSchema, votePollSchema } from '../middleware/validation.js';
import { emitRealtime } from '../realtime.js';

export const pollsRouter = Router();

// GET /api/polls (Public: list active & recent polls)
pollsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { status = 'ACTIVE' } = req.query;

    const where: any = {};
    if (status && typeof status === 'string' && status !== 'all') {
      where.status = status;
    }

    const polls = await prisma.poll.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, name: true, role: true } },
        options: {
          include: {
            _count: { select: { votes: true } }
          }
        },
        _count: { select: { votes: true } }
      }
    });

    const currentUserId = req.user?.id;
    let userVotes: Record<string, string> = {}; // pollId -> optionId

    if (currentUserId) {
      const votes = await prisma.pollVote.findMany({
        where: {
          userId: currentUserId,
          pollId: { in: polls.map(p => p.id) }
        },
        select: { pollId: true, optionId: true }
      });
      votes.forEach(v => {
        userVotes[v.pollId] = v.optionId;
      });
    }

    // Format poll results with percentage breakdown
    const formattedPolls = polls.map(poll => {
      const totalVotes = poll._count.votes;
      const optionsWithPct = poll.options.map(opt => {
        const count = opt._count.votes;
        const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
        return {
          id: opt.id,
          text: opt.text,
          votes: count,
          percentage
        };
      });

      return {
        id: poll.id,
        question: poll.question,
        category: poll.category,
        status: poll.status,
        author: poll.author,
        createdAt: poll.createdAt,
        totalVotes,
        userVotedOptionId: userVotes[poll.id] || null,
        options: optionsWithPct
      };
    });

    return res.json({ polls: formattedPolls });
  } catch (err: any) {
    console.error('Get polls error:', err);
    return res.status(500).json({ error: 'Failed to fetch polls' });
  }
});

// GET /api/polls/:id (Public: get single poll)
pollsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const poll = await prisma.poll.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true, role: true } },
        options: {
          include: {
            _count: { select: { votes: true } }
          }
        },
        _count: { select: { votes: true } }
      }
    });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    let userVotedOptionId: string | null = null;
    if (req.user?.id) {
      const vote = await prisma.pollVote.findUnique({
        where: { pollId_userId: { pollId: id, userId: req.user.id } }
      });
      if (vote) userVotedOptionId = vote.optionId;
    }

    const totalVotes = poll._count.votes;
    const options = poll.options.map(opt => {
      const count = opt._count.votes;
      const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
      return {
        id: opt.id,
        text: opt.text,
        votes: count,
        percentage
      };
    });

    return res.json({
      poll: {
        id: poll.id,
        question: poll.question,
        category: poll.category,
        status: poll.status,
        author: poll.author,
        createdAt: poll.createdAt,
        totalVotes,
        userVotedOptionId,
        options
      }
    });
  } catch (err: any) {
    console.error('Get single poll error:', err);
    return res.status(500).json({ error: 'Failed to fetch poll' });
  }
});

// POST /api/polls (Authenticated: create new poll)
pollsRouter.post('/', requireAuth, validateBody(createPollSchema), async (req: Request, res: Response) => {
  try {
    const { question, category = 'General', options } = req.body;
    const authorId = req.user!.id;

    const poll = await prisma.poll.create({
      data: {
        question: question.trim(),
        category: category.trim(),
        authorId,
        options: {
          create: options.map((optText: string) => ({
            text: optText.trim()
          }))
        }
      },
      include: {
        author: { select: { id: true, name: true, role: true } },
        options: true,
        _count: { select: { votes: true } }
      }
    });

    emitRealtime('poll:created', poll);

    return res.status(201).json({
      message: 'Poll created successfully',
      poll
    });
  } catch (err: any) {
    console.error('Create poll error:', err);
    return res.status(500).json({ error: 'Failed to create poll' });
  }
});

// POST /api/polls/:id/vote (User: submit vote)
pollsRouter.post('/:id/vote', requireAuth, validateBody(votePollSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { optionId } = req.body;
    const userId = req.user!.id;

    const poll = await prisma.poll.findUnique({
      where: { id },
      include: { options: true }
    });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    if (poll.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'This poll is closed for voting' });
    }

    const validOption = poll.options.some(o => o.id === optionId);
    if (!validOption) {
      return res.status(400).json({ error: 'Selected option does not belong to this poll' });
    }

    // Check if user already voted
    const existingVote = await prisma.pollVote.findUnique({
      where: { pollId_userId: { pollId: id, userId } }
    });

    if (existingVote) {
      return res.status(400).json({ error: 'You have already voted in this poll' });
    }

    await prisma.pollVote.create({
      data: {
        pollId: id,
        optionId,
        userId
      }
    });

    // Recalculate totals
    const updatedOptions = await prisma.pollOption.findMany({
      where: { pollId: id },
      include: { _count: { select: { votes: true } } }
    });

    const totalVotes = updatedOptions.reduce((acc, curr) => acc + curr._count.votes, 0);
    const optionsWithPct = updatedOptions.map(opt => ({
      id: opt.id,
      text: opt.text,
      votes: opt._count.votes,
      percentage: totalVotes > 0 ? Math.round((opt._count.votes / totalVotes) * 100) : 0
    }));

    emitRealtime('poll:vote_cast', {
      pollId: id,
      totalVotes,
      options: optionsWithPct
    });

    return res.json({
      message: 'Vote cast successfully',
      pollId: id,
      userVotedOptionId: optionId,
      totalVotes,
      options: optionsWithPct
    });
  } catch (err: any) {
    console.error('Vote poll error:', err);
    return res.status(500).json({ error: 'Failed to record vote' });
  }
});

// PATCH /api/polls/:id/close (Author or Admin: close poll)
pollsRouter.patch('/:id/close', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const poll = await prisma.poll.findUnique({ where: { id } });
    if (!poll) return res.status(404).json({ error: 'Poll not found' });

    if (poll.authorId !== req.user!.id && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'You are not authorized to close this poll' });
    }

    const updated = await prisma.poll.update({
      where: { id },
      data: { status: 'CLOSED' }
    });

    emitRealtime('poll:closed', { pollId: id });

    return res.json({ message: 'Poll closed successfully', poll: updated });
  } catch (err: any) {
    console.error('Close poll error:', err);
    return res.status(500).json({ error: 'Failed to close poll' });
  }
});
