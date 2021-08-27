import { Component, Input, OnChanges, OnInit, SimpleChanges, ViewEncapsulation } from '@angular/core';
import {
  create,
  isPlayerSupported,
  PlayerEventType,
  PlayerState,
} from 'amazon-ivs-player';

@Component({
  selector: 'app-video-player',
  templateUrl: './video-player.component.html',
  styleUrls: ['./video-player.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class VideoPlayerComponent implements OnInit, OnChanges {
  @Input()
  src: string = '';
  player: any;

  constructor() {
    this.player = create({
      techOrder: ["AmazonIVS"]
    } as any);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.src && !changes.src.firstChange) {
      // Setup stream and play
    this.player.setAutoplay(true);
    this.player.load('https://fcc3ddae59ed.us-west-2.playback.live-video.net/api/video/v1/us-west-2.893648527354.channel.DmumNckWFTqz.m3u8');
    this.player.setVolume(0.5);
    }
  }

  ngOnInit(): void {
    if (!isPlayerSupported) {
      console.warn("The current browser does not support the IVS player.");
      return;
    }
    // Initialize player
    console.log("IVS Player version:", this.player.getVersion());
    this.player.attachHTMLVideoElement(document.getElementById("video-player") as any);

    // Attach event listeners
    this.player.addEventListener(PlayerState.PLAYING, function () {
      console.log("Player State - PLAYING");
    });
    this.player.addEventListener(PlayerState.ENDED, function () {
      console.log("Player State - ENDED");
    });
    this.player.addEventListener(PlayerState.READY, function () {
      console.log("Player State - READY");
    });
    this.player.addEventListener(PlayerEventType.ERROR, function (err: any) {
      console.warn("Player Event - ERROR:", err);
    });
    this.player.addEventListener(PlayerEventType.TEXT_METADATA_CUE, (cue: { text: any; }) => {
      const metadataText = cue.text;
      const position = this.player.getPosition().toFixed(2);
      console.log(
        `PlayerEvent - TEXT_METADATA_CUE: "${metadataText}". Observed ${position}s after playback started.`
      );
    });
    this.player.setAutoplay(true);
    this.player.load('https://fcc3ddae59ed.us-west-2.playback.live-video.net/api/video/v1/us-west-2.893648527354.channel.DmumNckWFTqz.m3u8');
    this.player.setVolume(0.5);
  }

}
