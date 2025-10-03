import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

let ydoc: Y.Doc | null = null;
let provider: WebsocketProvider | null = null;
let yobjects: Y.Map<any> | null = null;
let yorder: Y.Array<string> | null = null;
let awareness: any = null;
let roomId: number | null = null;

export function initYjsConnection(roomName = '0') {
  if (ydoc) return { ydoc, provider, yobjects, yorder, awareness }; // already initialized

  ydoc = new Y.Doc();
  provider = new WebsocketProvider('ws://localhost:1234', "room-"+roomName.toString(), ydoc);
  yobjects = ydoc.getMap('objects');
  yorder = ydoc.getArray<string>('order');
  awareness = provider.awareness;
  roomId = parseInt(roomName);

  let clientColor = localStorage.getItem('clientColor');
  if (!clientColor) {
    clientColor = Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0');
    localStorage.setItem('clientColor', clientColor);
  }

  const user = JSON.parse(localStorage.getItem('user')!); 

  awareness.setLocalStateField('user', {
    id: user.id,
    name: user.name,
    email: user.email,
    color: '#' + clientColor,
  });

  provider.on('status', event => {
    console.log(event.status);
  });

  return { ydoc, provider, yobjects, yorder, awareness, roomId};
}

export { ydoc, provider, yobjects, yorder, awareness, roomId};