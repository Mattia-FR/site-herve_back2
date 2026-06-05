import type { NextFunction, Request, Response } from "express";
import { HONEYPOT_FIELD_NAME } from "../config/honeypot";

function isHoneypotTripped(body: unknown, fieldName: string): boolean {
  if (body == null || typeof body !== "object") return false;
  const value = (body as Record<string, unknown>)[fieldName];
  if (value == null) return false;
  if (typeof value === "string") return value.trim() !== "";
  return true;
}

type FakeResponseHandler = (req: Request, res: Response) => void;

export function createHoneypotMiddleware(
  onTripped: FakeResponseHandler,
  fieldName: string = HONEYPOT_FIELD_NAME
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (isHoneypotTripped(req.body, fieldName)) {
      onTripped(req, res);
      return;
    }
    next();
  };
}

const fakeMessageResponse = (_req: Request, res: Response): void => {
  res.status(201).json({
    id: 0,
    firstname: null,
    lastname: null,
    email: "",
    ip: null,
    subject: "",
    text: "",
    status: "unread",
    created_at: new Date().toISOString(),
  });
};

const fakeGuestbookResponse = (_req: Request, res: Response): void => {
  res.status(201).json({
    id: 0,
    author_name: "",
    email: null,
    message: "",
    status: "pending",
    created_at: new Date().toISOString(),
  });
};

export const honeypotMessageMiddleware = createHoneypotMiddleware(fakeMessageResponse);

export const honeypotGuestbookMiddleware = createHoneypotMiddleware(fakeGuestbookResponse);
