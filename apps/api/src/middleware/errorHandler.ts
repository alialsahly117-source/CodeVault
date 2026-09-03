import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export class AppError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(422).json({ error: "بيانات غير صحيحة.", details: err.flatten() });
  }
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Translate common Prisma error codes into clear, safe API responses
    // instead of letting them fall through as an opaque 500.
    if (err.code === "P2002") {
      return res.status(409).json({ error: "هذه القيمة مستخدمة بالفعل." });
    }
    if (err.code === "P2003") {
      return res.status(409).json({
        error: "لا يمكن إتمام هذا الإجراء لأن هذا العنصر لا يزال مرتبطًا بعناصر أخرى.",
      });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ error: "العنصر غير موجود." });
    }
  }
  // eslint-disable-next-line no-console
  console.error(err);
  return res.status(500).json({ error: "حدث خطأ في الخادم." });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: "المسار غير موجود." });
}
