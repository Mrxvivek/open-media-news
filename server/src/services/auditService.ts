import { prisma } from '../prisma.js';

export interface AuditLogParams {
  action: string;
  actorId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  targetId?: string | null;
  targetType?: string | null;
  details?: string | null;
}

export async function recordAudit(params: AuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: params.action,
        actorId: params.actorId || null,
        actorEmail: params.actorEmail || null,
        actorRole: params.actorRole || null,
        targetId: params.targetId || null,
        targetType: params.targetType || null,
        details: params.details || null
      }
    });
  } catch (err: any) {
    console.error('[AuditService] Failed to record audit log:', err.message);
  }
}
