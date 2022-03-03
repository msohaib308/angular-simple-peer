import { Injectable } from '@angular/core';
import { SignalData } from 'simple-peer';
import  {io, Socket}  from 'socket.io-client';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket!: Socket;
  isConnected = false;

  get socketId() {
    return this.socket.id
  }

  constructor() { }

  connect() {
    this.socket = io('http://localhost:3000')
  }

  private listen(channel: string, fn: Function) {
    this.socket.on(channel, fn as any)
  }

  private send(chanel: string, message: SignalMessage) {
    this.socket.emit(chanel, message)
  }

  onConnect(fn: () => void) {
    this.listen('connect', fn)
  }

  requestForJoiningRoom(msg: SignalMessage) {
    this.send('room_join_request', msg)
  }

  onRoomParticipants(fn: (participants: Array<string>) => void) {
    this.listen('room_users', fn)
  }

  sendOfferSignal(msg: SignalMessage) {
    this.send('offer_signal', msg)
  }

  onOffer(fn: (msg: SignalMessage) => void) {
    this.listen('offer', fn)
  }

  sendAnswerSignal(msg: SignalMessage) {
    this.send('answer_signal', msg)
  }

  onAnswer(fn: (msg: SignalMessage) => void) {
    this.listen('answer', fn)
  }

  onRoomLeft(fn: (data: {socketId: string}) => void) {
    this.listen('room_left', fn)
  }
}

export interface SignalMessage {
  callerId?: string
  calleeId?: string,
  signalData?: SignalData,
  msg?: string,
  roomName?: string
}
