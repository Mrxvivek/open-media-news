import { PrismaClient } from '@prisma/client';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../prisma/dev.db');

export const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL?.startsWith('file:/')
        ? process.env.DATABASE_URL
        : `file:${dbPath}`
    }
  }
});
