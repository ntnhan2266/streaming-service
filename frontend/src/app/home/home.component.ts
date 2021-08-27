import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

declare global {
  interface Window {
    constraints: any;
  }
}

const constraints = window.constraints = {
  audio: true,
  video: true
};

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  rtmpURL = '';
  streamKey = '';
  playURL = '';
  errorMSG = '';
  apiResult = '';
  configured = false;
  saved = false;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.getStream();
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

  handleError = (error: any) => {
    if (error.name === 'ConstraintNotSatisfiedError') {
      const v: any = constraints.video;
      console.error(`The resolution ${v.width.exact}x${v.height.exact} px is not supported by your device.`);
    } else if (error.name === 'NotAllowedError') {
      console.error('Permissions have not been granted to use your camera and ' +
        'microphone, you need to allow the page access to your devices in ' +
        'order for the demo to work.');
    }
    console.error(`getUserMedia error: ${error.name}`, error);
    this.errorMSG = error.name;
  }

  gotoCam = async () => {
    //console.log("Constrainsts", constraints)
    try {
      await navigator.mediaDevices.getUserMedia(constraints);
      console.log("Go to route change")
      } catch (error) {
        console.log("Error loop", error)
        this.handleError(error);
      }
  
  }
}
