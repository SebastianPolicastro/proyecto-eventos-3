import * as sessionsService from '../services/sessions.service.js';
import { AppError } from '../utils/AppError.js';
import { env } from '../config/env.js';

const COOKIE_NAME = 'currentUser';

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.NODE_ENV === 'production'
};

const handleError = (error, res) => {
  if (error instanceof AppError) {
    return res.status(error.status).json({ status: 'error', message: error.message });
  }
  console.error(error);
  res.status(500).json({ status: 'error', message: 'Error interno del servidor' });
};

export const register = async (req, res) => {
  try {
    const user = await sessionsService.register(req.body ?? {});
    res.status(201).json({ status: 'success', payload: user });
  } catch (error) {
    handleError(error, res);
  }
};

export const login = async (req, res) => {
  try {
    const token = await sessionsService.login(req.body ?? {});
    res
      .cookie(COOKIE_NAME, token, { ...cookieOptions, maxAge: 3600000 })
      .status(200)
      .json({ status: 'success', message: 'Login correcto' });
  } catch (error) {
    handleError(error, res);
  }
};

export const current = (req, res) => {
  const { id, email, role } = req.user;
  res.status(200).json({ status: 'success', payload: { id, email, role } });
};

export const logout = (req, res) => {
  res
    .clearCookie(COOKIE_NAME, cookieOptions)
    .status(200)
    .json({ status: 'success', message: 'Sesión cerrada' });
};
