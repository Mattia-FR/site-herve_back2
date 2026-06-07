import { randomUUID } from "node:crypto";
import argon2 from "argon2";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { argon2Options } from "../config/argon2";
import { env } from "../config/env";
import { logError } from "../utils/log/logHelpers";
import { InternalError, UnauthorizedError } from "../errors/AppError";
import usersModel from "../models/usersModel";
import { asyncHandler } from "../utils/asyncHandler";
import { sendError } from "../utils/sendError";

const ACCESS_EXPIRY = "15m";
const REFRESH_EXPIRY = "7d";
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: REFRESH_COOKIE_MAX_AGE,
};

function setRefreshTokenCookie(res: Response, token: string): void {
  res.cookie("refreshToken", token, REFRESH_COOKIE_OPTIONS);
}

function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie("refreshToken", {
    httpOnly: REFRESH_COOKIE_OPTIONS.httpOnly,
    secure: REFRESH_COOKIE_OPTIONS.secure,
    sameSite: REFRESH_COOKIE_OPTIONS.sameSite,
  });
}

function generateAccessToken(userId: number): string {
  return jwt.sign({ userId }, env.ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_EXPIRY });
}

function generateRefreshToken(userId: number): string {
  return jwt.sign({ userId, jti: randomUUID() }, env.REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_EXPIRY,
  });
}

const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.validatedBody as {
    email: string;
    password: string;
  };

  const user = await usersModel.findByEmail(email.trim());
  if (!user) {
    sendError(res, new UnauthorizedError("Email ou mot de passe incorrect", "INVALID_CREDENTIALS"));
    return;
  }

  const valid = await argon2.verify(user.password, password);
  if (!valid) {
    sendError(res, new UnauthorizedError("Email ou mot de passe incorrect", "INVALID_CREDENTIALS"));
    return;
  }

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);
  const refreshTokenHash = await argon2.hash(refreshToken, argon2Options);

  await usersModel.saveRefreshToken(user.id, refreshTokenHash);
  setRefreshTokenCookie(res, refreshToken);

  res.status(200).json({
    accessToken,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
    },
  });
});

const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken: string | undefined = req.cookies?.refreshToken;
  if (!refreshToken) {
    sendError(res, new UnauthorizedError("Session expirée", "TOKEN_EXPIRED"));
    return;
  }

  try {
    const payload = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET) as {
      userId: number;
    };

    const storedTokenHash = await usersModel.findRefreshTokenHash(payload.userId);
    if (!storedTokenHash) {
      sendError(res, new UnauthorizedError("Session expirée", "TOKEN_EXPIRED"));
      return;
    }

    const isRefreshTokenValid = await argon2.verify(storedTokenHash, refreshToken);
    if (!isRefreshTokenValid) {
      sendError(res, new UnauthorizedError("Session expirée", "TOKEN_EXPIRED"));
      return;
    }

    const newRefreshToken = generateRefreshToken(payload.userId);
    const newRefreshTokenHash = await argon2.hash(newRefreshToken, argon2Options);
    const accessToken = generateAccessToken(payload.userId);

    const rotated = await usersModel.rotateRefreshToken(
      payload.userId,
      storedTokenHash,
      newRefreshTokenHash
    );

    if (rotated) {
      setRefreshTokenCookie(res, newRefreshToken);
      res.status(200).json({ accessToken });
      return;
    }

    sendError(res, new UnauthorizedError("Session expirée", "TOKEN_EXPIRED"));
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError || err instanceof jwt.JsonWebTokenError) {
      sendError(res, new UnauthorizedError("Session expirée", "TOKEN_EXPIRED"));
      return;
    }
    logError("Erreur refresh token", err, req);
    sendError(res, new InternalError());
  }
});

const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken: string | undefined = req.cookies?.refreshToken;
  if (refreshToken) {
    try {
      const payload = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET) as {
        userId: number;
      };
      await usersModel.clearRefreshToken(payload.userId);
    } catch {
      // Token invalide — on continue le logout
    }
  }

  clearRefreshTokenCookie(res);
  res.sendStatus(204);
});

export { login, logout, refresh };
