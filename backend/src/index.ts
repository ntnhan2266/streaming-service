import * as dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import http from 'http';
import WebSocket from 'ws';
import callff from 'child_process';

import channelRoutes from "./routes/channel";

dotenv.config();

if (!process.env.PORT) {
  console.log('Env not found');
  process.exit(1);
}

const port: number = parseInt(process.env.PORT as string, 10);
const servertype = 'HTTP'
const home = '/wwww'

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/channel', channelRoutes);

app.get('/', (req, res) => {
  res.send('ok');
})

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

const transwraper = http.createServer(app).listen(3004, () => { console.log(`Listening on port: ${3004} ${servertype}`) })

// websocket creation
const wsRef = new WebSocket.Server({ server: transwraper });

app.use((req, res, next) => {
  console.log(`${servertype}:${req.method}:${req.originalUrl}`);
  return next();
});

app.use(express.static(__dirname + home));

// Streaming
wsRef.on('connection', (ws, req: any) => {
  const rtmpURL = 'rtmps://' + req.url.slice(7)
  console.log(`Stream url ${rtmpURL}`)

  const ffmpeg = callff.spawn(
    'ffmpeg',
    [
      '-re',
      '-i', '-',
      '-r', '30',
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-profile:v', 'main',
      '-preset', 'veryfast',
      '-x264opts', 'nal-hrd=cbr:no-scenecut',
      '-minrate', '3000',
      '-maxrate', '6000K',
      '-g', '120',
      '-c:a', 'aac',
      '-b:a', '160k',
      '-b:v', '6000K',
      '-ab', '160k',
      '-ac', '2',
      '-ar', '44100',
      '-video_size', '1280x720',
      '-s', '1280x720',
      '-framerate', '30',
      '-acodec', 'aac',
      '-f', 'flv',
      rtmpURL
      // '-i', '-', 
      // '-vcodec', 'copy', 
      // '-preset', 'veryfast', 
      // '-tune', 'zerolatency', 
      // '-acodec', 'aac', 
      // '-reconnect', '3', 
      // '-reconnect_at_eof', '1', 
      // '-reconnect_streamed', '3', 
      // '-f', 'flv', 
      // rtmpURL
    ]);

  ffmpeg.on('close', (code: any, signal: any) => {
    console.log(`FFMPEG closed, reason ${code} , ${signal}`);
    ws.send('Closing Socket'); /// message to front end
    ws.terminate();
  });

  ffmpeg.stdin.on('error', (e: any) => {
    ws.send(e);
    console.log(`FFMPEG ERROR: ${e}`)
    ws.terminate();
  });

  ffmpeg.stderr.on('data', (data: { toString: () => any; }) => {
    console.log(`FFMPEG MSG: ${data.toString()}`)
    ws.send(data.toString());
  });

  ws.on('message', (evt) => {
    console.log('Event', evt);
    ffmpeg.stdin.write(evt);
  });

  ws.on('error', (err) => {
    console.log('ERROR on websocket', err);
  });

  ws.on('close', (evt) => {
    ffmpeg.kill('SIGINT');
    console.log(`Connection Closed: ${evt}`)
  });
});

