import type { Request } from "express";
import { prisma } from "../../lib/prisma.js";

export async function logAction(
  req: Request,
  action: string,
  targetType?: string,
  targetId?: string,
  meta?: object
) {
  await prisma.adminLog.create({
    data: {
      adminId: req.user!.id,
      action,
      targetType,
      targetId,
      meta,
      ip: req.ip,
    },
  });
}
