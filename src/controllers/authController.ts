/**
 * Controller d'authentification — login, refresh token, logout.
 *
 * Rôle : gérer l'authentification JWT avec un système de tokens rotatif :
 *   - Access token (15 min) → transmis en JSON dans la réponse
 *   - Refresh token (7 jours) → stocké dans un cookie httpOnly sécurisé
 *
 * Stratégie de sécurité :
 *   1. Le refresh token est haché avec Argon2 avant stockage en base
 *   2. À chaque refresh, l'ancien token est invalidé et un nouveau est généré
 *      (rotation) — détecte la réutilisation de tokens volés
 *   3. Le refresh token côté client est inaccessible au JS (httpOnly)
 *   4. En production, le cookie n'est transmis que via HTTPS (secure: true)
 *
 * Routes correspondantes : POST /api/auth/login, /refresh, /logout
 */
import { randomUUID } from "node:crypto";
import argon2 from "argon2";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { argon2Options } from "../config/argon2";
import { env } from "../config/env";
import { DEFAULT_ERROR_MESSAGES, ErrorCode } from "../config/errorCodes";
import { InternalError, UnauthorizedError } from "../errors/AppError";
import usersModel from "../models/usersModel";
import { asyncHandler } from "../utils/asyncHandler";
import { logError } from "../utils/log/logHelpers";
import { sendError } from "../utils/sendError";

/** Durée de vie des tokens */
const ACCESS_EXPIRY = "15m";
const REFRESH_EXPIRY = "7d";
/** Durée du cookie en millisecondes (doit correspondre à REFRESH_EXPIRY) */
const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

/** Options du cookie refresh token — httpOnly empêche l'accès JS */
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === "production", // HTTPS uniquement en production
  sameSite: "strict" as const, // protection CSRF
  maxAge: REFRESH_COOKIE_MAX_AGE,
};

/** Pose le cookie refresh token sur la réponse. */
function setRefreshTokenCookie(res: Response, token: string): void {
  res.cookie("refreshToken", token, REFRESH_COOKIE_OPTIONS);
}

/** Supprime le cookie refresh token (logout). */
function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie("refreshToken", {
    httpOnly: REFRESH_COOKIE_OPTIONS.httpOnly,
    secure: REFRESH_COOKIE_OPTIONS.secure,
    sameSite: REFRESH_COOKIE_OPTIONS.sameSite,
  });
}

/** Génère un access token JWT signé avec ACCESS_TOKEN_SECRET. */
function generateAccessToken(userId: number): string {
  return jwt.sign({ userId }, env.ACCESS_TOKEN_SECRET, { expiresIn: ACCESS_EXPIRY });
}

/**
 * Génère un refresh token JWT signé avec REFRESH_TOKEN_SECRET.
 * Le claim `jti` (JWT ID) est un UUID unique qui permet de distinguer
 * chaque token émis, même pour le même utilisateur.
 */
function generateRefreshToken(userId: number): string {
  return jwt.sign({ userId, jti: randomUUID() }, env.REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_EXPIRY,
  });
}

/**
 * POST /api/auth/login
 * Authentifie l'utilisateur avec email + mot de passe.
 * Retourne un access token JSON et pose le cookie refresh.
 * Le même message d'erreur est retourné que l'email soit inconnu ou le mot de
 * passe incorrect (anti-énumération d'emails).
 */
const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.validatedBody as {
    email: string;
    password: string;
  };

  const user = await usersModel.findByEmail(email.trim());
  if (!user) {
    sendError(
      res,
      new UnauthorizedError(
        DEFAULT_ERROR_MESSAGES[ErrorCode.INVALID_CREDENTIALS],
        ErrorCode.INVALID_CREDENTIALS
      )
    );
    return;
  }

  // Vérification Argon2id — timing-safe par construction
  const valid = await argon2.verify(user.password, password);
  if (!valid) {
    sendError(
      res,
      new UnauthorizedError(
        DEFAULT_ERROR_MESSAGES[ErrorCode.INVALID_CREDENTIALS],
        ErrorCode.INVALID_CREDENTIALS
      )
    );
    return;
  }

  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken(user.id);
  // Hacher le refresh token avant de le stocker en base (même principe que les mots de passe)
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

/**
 * POST /api/auth/refresh
 * Renouvelle l'access token via le refresh token stocké dans le cookie.
 * Implémente la rotation : l'ancien refresh token est invalidé et un nouveau est émis.
 * Si le hash stocké en base ne correspond plus (token déjà utilisé ou révoqué),
 * la requête est rejetée — détection de réutilisation de token volé.
 */
const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken: string | undefined = req.cookies?.refreshToken;
  if (!refreshToken) {
    sendError(
      res,
      new UnauthorizedError(
        DEFAULT_ERROR_MESSAGES[ErrorCode.TOKEN_EXPIRED],
        ErrorCode.TOKEN_EXPIRED
      )
    );
    return;
  }

  try {
    const payload = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET) as {
      userId: number;
    };

    // Vérifier que le token est toujours enregistré en base
    const storedTokenHash = await usersModel.findRefreshTokenHash(payload.userId);
    if (!storedTokenHash) {
      sendError(
        res,
        new UnauthorizedError(
          DEFAULT_ERROR_MESSAGES[ErrorCode.TOKEN_EXPIRED],
          ErrorCode.TOKEN_EXPIRED
        )
      );
      return;
    }

    // Vérifier que le token reçu correspond bien au hash stocké
    const isRefreshTokenValid = await argon2.verify(storedTokenHash, refreshToken);
    if (!isRefreshTokenValid) {
      sendError(
        res,
        new UnauthorizedError(
          DEFAULT_ERROR_MESSAGES[ErrorCode.TOKEN_EXPIRED],
          ErrorCode.TOKEN_EXPIRED
        )
      );
      return;
    }

    // Rotation : générer un nouveau couple access/refresh token
    const newRefreshToken = generateRefreshToken(payload.userId);
    const newRefreshTokenHash = await argon2.hash(newRefreshToken, argon2Options);
    const accessToken = generateAccessToken(payload.userId);

    // rotateRefreshToken remplace l'ancien hash par le nouveau en base de façon atomique.
    // Retourne false si l'ancien hash n'existe plus (concurrence ou révocation).
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

    sendError(
      res,
      new UnauthorizedError(
        DEFAULT_ERROR_MESSAGES[ErrorCode.TOKEN_EXPIRED],
        ErrorCode.TOKEN_EXPIRED
      )
    );
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError || err instanceof jwt.JsonWebTokenError) {
      sendError(
        res,
        new UnauthorizedError(
          DEFAULT_ERROR_MESSAGES[ErrorCode.TOKEN_EXPIRED],
          ErrorCode.TOKEN_EXPIRED
        )
      );
      return;
    }
    logError("Erreur refresh token", err, req);
    sendError(res, new InternalError());
  }
});

/**
 * POST /api/auth/logout
 * Supprime le refresh token en base et efface le cookie côté client.
 * Retourne 204 No Content même si le token est absent ou invalide
 * (déconnexion idempotente).
 */
const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken: string | undefined = req.cookies?.refreshToken;
  if (refreshToken) {
    try {
      const payload = jwt.verify(refreshToken, env.REFRESH_TOKEN_SECRET) as {
        userId: number;
      };
      await usersModel.clearRefreshToken(payload.userId);
    } catch {
      // Token invalide ou expiré — on continue le logout sans erreur
    }
  }

  clearRefreshTokenCookie(res);
  res.sendStatus(204);
});

export { login, logout, refresh };
