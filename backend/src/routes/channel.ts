import express, {Request, Response} from 'express';

import ivsService, {createChannelCommand} from '../services/ivs';

const router = express.Router();

async function createChannel(req: Request, res: Response) {
  const ivsResponse = await ivsService.send(createChannelCommand);
  res.send(ivsResponse);
}

router.post('/create', createChannel);

export default router;