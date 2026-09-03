import { Response } from 'express';
import { AuthedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { registerUser, loginUser } from '../services/authService';

export const register = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { name, email, password } = req.body ?? {};
  const result = await registerUser(name, email, password);
  res.status(201).json(result);
});

export const login = asyncHandler(async (req: AuthedRequest, res: Response) => {
  const { email, password } = req.body ?? {};
  const result = await loginUser(email, password);
  res.status(200).json(result);
});
