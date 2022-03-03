import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import * as SimplePeer from 'simple-peer';
import { PrmierPeer } from 'src/app/Models/simple-peer.model';
import { SignalData } from 'simple-peer';
import { SignalMessage, SocketService } from 'src/app/core/socket.service';

@Component({
  selector: 'app-live-room',
  templateUrl: './live-room.component.html',
  styleUrls: ['./live-room.component.scss']
})
export class LiveRoomComponent implements OnInit {
  @ViewChild('myVideo') myVideo!: ElementRef<HTMLVideoElement>;
  peersList: PrmierPeer[] = [];
  socketConnected!: boolean;
  roomName!: string;
  iceServers: RTCIceServer[] = [
    {urls:'stun:stun.l.google.com:19302'},
    {urls:'stun:stun1.l.google.com:19302'},
    {urls:'stun:stun2.l.google.com:19302'},
    {urls:'stun:stun3.l.google.com:19302'},
    {urls:'stun:stun4.l.google.com:19302'},
  ];
  constructor(private socketService: SocketService, private route: ActivatedRoute) {
   }

  ngOnInit(): void {
    this.roomName = this.route.snapshot.queryParams['roomName'];
    if (!this.roomName) {
      alert('No Room id provided');
      return;
    }
    this.socketService.connect();

    this.socketService.onConnect(() => {
      console.log('Socket Connected');
      this.socketConnected = true;
      this.PrepareRoom();
    })
    // setTimeout(() => {
    // }, 2000);
  }
  async GetUserMedia() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 300, height: 300 }, audio: true })
    this.myVideo.nativeElement.srcObject = stream;
    this.myVideo.nativeElement.muted = true;
    this.myVideo.nativeElement.play()
    return stream;
  }
  async PrepareRoom() {
    const mStream = await this.GetUserMedia();
    this.socketService.requestForJoiningRoom({ roomName: this.roomName });
    this.socketService.onRoomParticipants(participants => {
      // console.log(`${this.socketService.socketId} - On Room Participants`)

      //this.socketService.sendOfferSignal({ signalData: { type: 'offer', sdp: 'kldjfdfkgjdkjk' }, callerId: this.socketService.socketId, calleeId: participants.find(id => id != this.socketService.socketId) })
      this.initilizePeersAsCaller(participants, mStream)
    });

    this.socketService.onOffer(msg => {
      this.initilizePeersAsCallee(msg, mStream)
    });

    this.socketService.onAnswer((msg: SignalMessage) => {
      console.log(`${this.socketService.socketId} - You got Answer from ${msg.calleeId}`)
      const mitronPeer = this.peersList.find(mitronPeer => mitronPeer.peerId === msg.calleeId)
      mitronPeer!.peer.signal(msg.signalData as SignalData)
    });

    this.socketService.onRoomLeft(data => {
      console.log('Room Left')
      this.peersList = this.peersList.filter(mitronPeer => data.socketId != mitronPeer.peerId)
    });
  }

  initilizePeersAsCaller(participants: Array<string>, stream: MediaStream) {
    const participantsExcludingMe = participants.filter(id => id != this.socketService.socketId)
    participantsExcludingMe.forEach(peerId => {

      const peer: SimplePeer.Instance = new SimplePeer({
        initiator: true,
        trickle: false,
        config: {
          iceServers: this.iceServers
        },
        stream
      })

      peer.on('signal', signal => {
        console.log(`${this.socketService.socketId} Caller Block ${signal}`)
        this.socketService.sendOfferSignal({ signalData: signal, callerId: this.socketService.socketId, calleeId: peerId })
      })

      // peer.on('stream', stream => {
      //   this.peerVideos.first.nativeElement.srcObject = stream
      //   this.peerVideos.first.nativeElement.play()
      // })
      this.peersList.push({ peerId: peerId, peer: peer })
      peer.on('stream', stream => {
        this.HandleStream(peerId || '', stream);
      })
      peer.on("close", ()=> {
        console.log('Connection closed')
      })
      peer.on('error', (err)=> {
        console.log('Some Peer removed 123' + err.message);
      })
      peer.on('end', () => {
        console.log('Peer ended');
      })
    })
  }

  initilizePeersAsCallee(msg: SignalMessage, stream: MediaStream) {
    console.log(`${this.socketService.socketId} You have an offer from ${msg.callerId}`)
    // this.socketService.sendAnswerSignal({ signalData: msg.signalData, callerId: msg.callerId })

    const peer: SimplePeer.Instance = new SimplePeer({
      initiator: false,
      trickle: false,
      config: {
        iceServers: this.iceServers
      },
      stream
    })

    peer.on('signal', signal => {
      console.log(`${this.socketService.socketId} Callee Block ${signal}`)
      this.socketService.sendAnswerSignal({ signalData: signal, callerId: msg.callerId })
    })


    peer.signal(msg.signalData as SignalData)
    this.peersList.push({ peerId: msg.callerId || '', peer: peer })
    peer.on('stream', stream => {
      this.HandleStream(msg.callerId || '', stream);
    })
    peer.on("close", ()=> {
      console.log('Some Peer removed');
    })
    peer.on('error', ()=> {
      console.log('Some Peer removed 123');
    })
    peer.on('end', () => {
      console.log('Some Peer removed 121113');
    })
  }
  HandleStream(peerId: string,stream: MediaStream) {
      // got remote video stream, now let's show it in a video tag
      var video = (document.getElementById(peerId) || {}) as HTMLVideoElement;

      if ('srcObject' in video) {
        video.srcObject = stream
      } else {
        video.src = window.URL.createObjectURL(stream as any) // for older browsers
      }

      video.play()
  }

}
