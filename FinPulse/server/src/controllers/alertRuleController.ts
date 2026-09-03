import { Response } from 'express';
import { AuthedRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/error';
import { listAlertRules, createAlertRule, getAlertRule, updateAlertRule, deleteAlertRule } from '../services/alertRuleService';

export const getAlertRules = asyncHandler(async (req: AuthedRequest, res: Response) => {
  res.json(await listAlertRules(req.userId as string));
});

export const postAlertRule = asyncHandler(async (req: AuthedRequest, res: Response) => {
  res.status(201).json(await createAlertRule(req.userId as string, req.body ?? {}));
});

export const getAlertRuleById = asyncHandler(async (req: AuthedRequest, res: Response) => {
  res.json(await getAlertRule(req.userId as string, req.params.id));
});

export const patchAlertRule = asyncHandler(async (req: AuthedRequest, res: Response) => {
  res.json(await updateAlertRule(req.userId as string, req.params.id, req.body ?? {}));
});

export const removeAlertRule = asyncHandler(async (req: AuthedRequest, res: Response) => {
  res.json(await deleteAlertRule(req.userId as string, req.params.id));
});
