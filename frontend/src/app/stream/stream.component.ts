import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';

declare var MediaRecorder: any;

@Component({
  selector: 'app-stream',
  templateUrl: './stream.component.html',
  styleUrls: ['./stream.component.scss']
})
export class StreamComponent implements OnInit {
  @ViewChild('stream', { static: true })
  stream!: any;
  aDevID = '';
  vDevID = '';
  errorMSG = '';
  debugMSG = '';
  rtmpURL = '';
  streamKey = '';
  playURL = '';
  apiResult = '';
  configured = false;
  saved = false;
  mediaRecorder: any = {};
  wsRef: any = {};
  devices = { videoin: null, audioin: null, audioout: null };
  status = { isConnecting: false, isStreaming: false, isShowPlayer: false };
  alertFromServers = '';
  wrapServers = { primaryServer: null, secondaryServer: null };
  constraints = { audio: { autoplay: true, deviceId: this.aDevID }, video: { width: 1280, height: 720, deviceId: this.vDevID } };
  
  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.getDevices();
    this.getStream();
    console.log(this.stream)
  }

  getStream() {
    this.http.get('http://localhost:8080/channel/getByUserId').subscribe((res: any)=> {
      if (res.status == 1) {
        const {data}: any = res;
        const {ingestEndpoint, playbackUrl, streamKey} = data;
        this.rtmpURL = ingestEndpoint;
        this.playURL = playbackUrl;
        this.streamKey = streamKey;
        this.configured = true;
      }
    })
  }

  getDevices = async () => {
    const gotDevices = await navigator.mediaDevices.enumerateDevices()
    this.handleList(gotDevices);
  }

  handleList = (gotDevices: any[]) => {
    console.log("List Cam", gotDevices.length)
    let vidin: any = [];
    let auin: any = [];
    let audioOut: any = [];
    gotDevices.forEach(function (gotDevice: { kind: string; label: any; deviceId: any; }) {
      console.log("gotDevices for each")
      let i = 0
      if (gotDevice.kind === 'audioinput') {
        //console.log("audioin", gotDevice.kind + ": " + gotDevice.label + " id = " + gotDevice.deviceId);
        auin.push({ label: gotDevice.label, id: gotDevice.deviceId, len: i++ })
      } else if (gotDevice.kind === 'videoinput') {
        //console.log("video", gotDevice.kind + ": " + gotDevice.label + " id = " + gotDevice.deviceId);
        vidin.push({ label: gotDevice.label, id: gotDevice.deviceId })
      } else if (gotDevice.kind === 'audiooutput') {
        //console.log("audioout??", gotDevice.kind + ": " + gotDevice.label + " id = " + gotDevice.deviceId);
        audioOut.push({ label: gotDevice.label, id: gotDevice.deviceId })
      } else { console.log('Some other kind of source/device: ', gotDevice); }
    })
    console.log("Input source", vidin, auin, audioOut)
    this.devices = { audioin: auin, videoin: vidin, audioout: audioOut };
    this.enableCam()
  }

  stopStreaming = () => {
    if (this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
      this.wsRef.close();
    }
    this.status = {isConnecting:false, isStreaming:false, isShowPlayer:false}
    this.debugMSG = '';
  };

  startStreaming = async () =>{
    let localtest = '//127.0.0.1:3004';
    let wsUrl = `${'ws:'}${localtest}/rtmps/${this.rtmpURL}:443/app/${this.streamKey}`;

    this.wsRef.current = new WebSocket(wsUrl)
    console.log("ws init", this.wsRef)

    this.wsRef.current.onerror = (err: any) => {
      this.alertFromServers = "WARNING! SERVER 1 - Socket Closed!!!";
      console.error("Got a error!!!", err, this.wsRef.current)
    }

    this.wsRef.current.onclose = (e: { reason: any; }) => {
        console.log ("Fallback 1",  e.reason)
    }

    this.wsRef.current.onmessage = (evt: { data: any; }) =>{
        //console.log("MSG!!", evt)
        self.debugMSG = evt.data
    }

    const self = this;

    this.wsRef.current.addEventListener('open', async function open(data: any) {
      console.log("Open!!!", data)
      self.status.isConnecting = true;

      if (data){
        console.log("!@@@@!!!")
        self.status = {isConnecting:false, isStreaming:true, isShowPlayer:true}
      }
    });
    let vidStreaming = this.stream.nativeElement.captureStream();
    let outputStream = new MediaStream();
    [vidStreaming].forEach(function (s) {
      s.getTracks().forEach(function (t: MediaStreamTrack) {
        outputStream.addTrack(t);
      });
    });
    this.mediaRecorder = new MediaRecorder(outputStream, {
      mimeType: 'video/webm',
      videoBitsPerSecond: 3000000,
    });
    this.mediaRecorder.addEventListener('dataavailable', (e: { data: any; }) => {
      this.wsRef.current.send(e.data);
    });
    this.mediaRecorder.start(1000);
} 

  // C3 enable camera 
  enableCam = async () => {
    console.log("Loop enable cam")
    console.log("video ID", this.vDevID, this.aDevID)
    console.log("contrainsts", this.constraints)
    await navigator.mediaDevices.getUserMedia(
      this.constraints
    ).then(function (mediaStream) {
      console.log("MediaDevice", mediaStream);
      (window as any).stream = mediaStream;
      var stream: any = document.getElementById('videoElement') || {};
      var videoTracks = mediaStream.getVideoTracks();

      console.log(`Using video device: ${videoTracks[0].label}`);

      //window.stream = stream;
      stream.srcObject = mediaStream;

      stream.onloadedmetadata = async function () {
        await stream.play();
      };


    })
      .catch(error => {
        console.error("Error in EnCam", error);
        this.handleError(error);
      });

    //this.setState({showCam: true})
    //console.log("en cam", this.state.showCam);
  };

  handleError = (error: any) => {
    if (error.name === 'ConstraintNotSatisfiedError') {
      const v: any = this.constraints.video;
      console.error(`The resolution ${v.width.exact}x${v.height.exact} px is not supported by your device.`);
    } else if (error.name === 'NotAllowedError') {
      console.error('Permissions have not been granted to use your camera and ' +
        'microphone, you need to allow the page access to your devices in ' +
        'order for the demo to work.');
    }
    console.error(`getUserMedia error: ${error.name}`, error);
    this.errorMSG = error.name;
  }

}
