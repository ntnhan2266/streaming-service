import express, { Request, Response } from 'express';

import ivsService, { createChannelCommand } from '../services/ivs';

const router = express.Router();

async function createChannel(req: Request, res: Response) {
  const ivsResponse = await ivsService.send(createChannelCommand);
  // save DB
  res.send(ivsResponse)
}

async function getChannel(req: Request, res: Response) {
  const data = {
    streamKey: 'sk_us-east-1_cx4gEnbTCxmP_Uw4sdVxEbQRWXR2sidaTZ103FELfWG',
    ingestEndpoint: 'f4bb5af228da.global-contribute.live-video.net',
    playbackUrl: 'https://f4bb5af228da.us-east-1.playback.live-video.net/api/video/v1/us-east-1.289591261120.channel.O4tMie8uJ7ZK.m3u8'
  }

  res.send({ data, status: 1, message: '' });
}

async function getListChannels(req: Request, res: Response) {
  const data = {
    channels: [
      {
        name: 'Test',
        url: 'https://f4bb5af228da.us-east-1.playback.live-video.net/api/video/v1/us-east-1.289591261120.channel.EIOY36yiPR4v.m3u8'
      }
    ]
  }

  res.send({ data, status: 1, total: 1 });

}

router.post('/create', createChannel);
router.get('/getByUserId', getChannel);

export default router;