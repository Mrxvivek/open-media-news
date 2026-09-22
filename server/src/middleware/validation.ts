import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

/**
 * Generic Express middleware to validate request body against a Zod schema.
 */
export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const issues = result.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message
      }));
      const formattedMessage = issues.map(i => `${i.field ? `${i.field}: ` : ''}${i.message}`).join(', ');
      return res.status(400).json({
        error: `Validation failed: ${formattedMessage}`,
        message: formattedMessage,
        details: issues
      });
    }
    req.body = result.data;
    next();
  };
};

// --- Authentication Schemas ---
export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

export const loginSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

// --- Admin Schemas ---
export const createUserSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Invalid email address'),
  role: z.enum(['USER', 'PUBLISHER', 'ADMIN'], {
    message: 'Role must be USER, PUBLISHER, or ADMIN'
  }),
  password: z.string().min(6, 'Password must be at least 6 characters').optional()
});

const articleStatus = z.enum(['DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED', 'CHANGES_REQUESTED', 'TAKEN_DOWN']);

export const updateStatusSchema = z.object({
  status: articleStatus,
  editorialFeedback: z.string().trim().max(2000).optional()
});

export const batchStatusSchema = z.object({
  articleIds: z.array(z.string().min(1, 'Article ID cannot be empty')).min(1, 'At least one article ID required'),
  status: articleStatus,
  editorialFeedback: z.string().trim().max(2000).optional()
});

export const editArticleSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters').optional(),
  summary: z.string().trim().min(5, 'Summary must be at least 5 characters').optional(),
  body: z.string().trim().min(10, 'Body must be at least 10 characters').optional(),
  category: z.string().trim().min(1, 'Category cannot be empty').optional(),
  domain: z.string().trim().optional(),
  image: z.string().trim().optional(),
  imageUrl: z.string().trim().optional(),
  status: articleStatus.optional(),
  editorialFeedback: z.string().trim().max(2000).optional()
});

// --- Article & Comment Schemas ---
export const createArticleSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters'),
  summary: z.string().trim().min(5, 'Summary must be at least 5 characters'),
  body: z.string().trim().min(10, 'Body must be at least 10 characters'),
  category: z.string().trim().min(1, 'Category is required'),
  domain: z.string().trim().optional(),
  image: z.string().trim().optional(),
  imageUrl: z.string().trim().optional(),
  author: z.object({
    id: z.string().trim().optional(),
    name: z.string().trim().optional(),
    email: z.string().trim().email().optional()
  }).optional(),
  status: z.enum(['DRAFT', 'PENDING', 'PUBLISHED', 'REJECTED', 'CHANGES_REQUESTED', 'TAKEN_DOWN']).default('PENDING')
});

export const resubmitArticleSchema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters'),
  summary: z.string().trim().min(5, 'Summary must be at least 5 characters'),
  body: z.string().trim().min(10, 'Body must be at least 10 characters'),
  category: z.string().trim().min(1, 'Category is required'),
  domain: z.string().trim().optional(),
  image: z.string().trim().optional(),
  imageUrl: z.string().trim().optional()
});

export const createCommentSchema = z.object({
  content: z.string().trim().min(1, 'Comment content cannot be empty').max(2000, 'Comment exceeds 2000 characters')
});

export const createEventSchema = z.object({
  title: z.string().trim().min(3, 'Event title must be at least 3 characters'),
  description: z.string().trim().min(10, 'Event description must be at least 10 characters'),
  category: z.string().trim().min(1, 'Event category is required'),
  location: z.string().trim().min(1, 'Event location is required'),
  eventDate: z.string().trim().min(1, 'Event date is required'),
  imageUrl: z.string().trim().optional(),
  organizerId: z.string().trim().min(1).optional().nullable()
});

export const updateEventStatusSchema = z.object({
  status: z.enum(['PENDING', 'PUBLISHED', 'REJECTED', 'CHANGES_REQUESTED', 'DRAFT']),
  editorialFeedback: z.string().trim().max(2000).optional()
});
