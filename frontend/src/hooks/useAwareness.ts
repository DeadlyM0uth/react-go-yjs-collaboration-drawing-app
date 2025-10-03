import * as fabric from 'fabric'
import { useRef, useState, useEffect } from 'react';
import { awareness, ydoc } from "../collaboration/yjs";

const cursorPath = "M248,121.58a15.76,15.76,0,0,1-11.29,15l-.2.06-78,21.84-21.84,78-.06.2a15.77,15.77,0,0,1-15,11.29h-.3a15.77,15.77,0,0,1-15.07-10.67L41,61.41a1,1,0,0,1-.05-.16A16,16,0,0,1,61.25,40.9l.16.05,175.92,65.26A15.78,15.78,0,0,1,248,121.58Z";

export const useAwareness = (canvas: fabric.Canvas | null) => {
  const cursorsRef = useRef<Map<string, fabric.Group>>(new Map());
  const [users, setUsers] = useState<{id:number; name: string; email: string; color: string }[]>([]);

  const renderSelectionIndicators = (states: [number, {[x: string]:any}][]) => {
    if (!canvas) return;
  
    // Clear existing selection indicators
    canvas.getObjects()
      .filter(obj => obj.isSelectionIndicator)
      .forEach(obj => canvas.remove(obj));
  
    // Get all awareness states
    // const states = Array.from(awareness.getStates().entries());
    const localUser = JSON.parse(localStorage.getItem('user')!); 

    states.forEach(([clientID, state]) => {
      const { user, selection } = state as any;
      if (!user || !selection?.objectId) return;
      if (user.id === localUser.id) return; // Skip local user

      // Find the object being selected by this client
      const selectedObj = canvas.getObjects().find(o => o.id === selection.objectId);
      if (!selectedObj) return;
      
      // Create a border highlight
      const border = new fabric.Rect({
        left: selectedObj.left! - 5,
        top: selectedObj.top! - 5,
        width: selectedObj.width! * selectedObj.scaleX! + 10,
        height: selectedObj.height! * selectedObj.scaleY! + 10,
        stroke: user.color,
        strokeWidth: 2,
        angle: selectedObj.angle,
        fill: 'transparent',
        strokeDashArray: [5, 5],
        selectable: false,
        evented: false,
        isSelectionIndicator: true
      });
      
      // Create a nametag
      const nametag = new fabric.IText(user.name, {
        left: selectedObj.left!,
        top: selectedObj.top! - 25,
        fontSize: 12,
        fill: user.color,
        backgroundColor: 'white',
        padding: 2,
        selectable: false,
        evented: false,
        isSelectionIndicator: true
      });
      
      canvas.add(border);
      canvas.add(nametag);
      
      // Make sure indicators stay with the object when it moves
      selectedObj.on('moving', () => {
        border.set({
          left: selectedObj.left! - 5,
          top: selectedObj.top! - 5
        });
        nametag.set({
          left: selectedObj.left!,
          top: selectedObj.top! - 25
        });
        canvas.requestRenderAll();
      });
      
      // Make sure indicators are removed when the object is deleted
      selectedObj.on('removed', () => {
        canvas.remove(border);
        canvas.remove(nametag);
      });
    });
    
    canvas.requestRenderAll();
  };

  const renderCursors = (states: [number, {[x: string]:any}][]) => {
    const existing = cursorsRef.current
    // const activeIds = states.map(([clientID]) => clientID);
    const activeClientIds = states
      .map(([, state]) => state.user?.id);

    // Remove cursors for users who are no longer present
    for (const id of existing.keys()) {
      if (!activeClientIds.includes(id)) {
        existing.get(id)?.removeAll();
        canvas?.remove(existing.get(id)!);
        existing.delete(id);
      }
    }
    
    // for each peer, render or update their cursor
    states.forEach(([, state]) => {
      const {   user, pointer } = state as any;
      if (!pointer || !user || !user.id) return;
      
      // if (clientID === ydoc.clientID) return; // skip local
      // const { user, pointer } = state as any;
      // if (!pointer || !user) return;
 
      const localClientId = JSON.parse(localStorage.getItem('user')!).id;
      if (user.id === localClientId) return;

      let cursorObj = existing.get(user.id);

      if (!cursorObj) {
        const cursor = new fabric.Path(cursorPath, {
          fill: user.color,
          left:pointer.x,
          top:pointer.y,
          originX: 'center',
          originY: 'center',
          scaleX: 0.1,
          scaleY: 0.1,
          selectable: false,
          evented: false,
          stroke: "#ffffff",
          strokeWidth: 20,
        }) 
        const label = new fabric.FabricText(user.name, {
          fontSize: 12,
          fill: user.color,
          originX: 'left',
          originY: 'bottom',
          left: cursor.left! + 8,
          top: cursor.top! - 4,
          selectable: false,
          evented: false,
          shadow: new fabric.Shadow({color: 'white', offsetX:0, offsetY: 0})
        });
        cursorObj = new fabric.Group([cursor, label], {
          selectable: false,
          evented: false,
          isCursor: true,
        });
        existing.set(user.id, cursorObj);
        canvas?.add(cursorObj);
        canvas?.bringObjectToFront(cursorObj);
      }
      // update position
      cursorObj.set({
        left: pointer.x,
        top: pointer.y
      });
    });
  }

  //awareness
  useEffect(() => {
    if (!canvas) return;

    const handleMouseMove = (opt: any) => {
      const pointer = canvas.getScenePoint(opt.e)
      awareness.setLocalStateField('pointer', {
        x: pointer.x,
        y: pointer.y
      })
    }

    const updateUsers = () => {
      const states = Array.from(awareness.getStates().values());
      const userList = states
        .map((state: any) => state.user)
        .filter((user) => user); // Убираем undefined

      // Обновляем только если список пользователей изменился
      setUsers((prevUsers) => {
        const isSame = prevUsers.length === userList.length &&
          prevUsers.every((user, index) => user.name === userList[index].name && user.color === userList[index].color);
        return isSame ? prevUsers : userList;
      });
    };

    const onAwarenessChange = () => {
      const states = Array.from(
        awareness.getStates().entries()
      ) as [number, { [x: string]: any }][];
      renderCursors(states);
      renderSelectionIndicators(states);
      updateUsers();
      canvas.requestRenderAll();
    };

    awareness.on('change', onAwarenessChange);
    canvas.on('mouse:move', handleMouseMove); 
    // canvas.on('object:modified', () => renderSelectionIndicators());
    // canvas.on('object:moving', () => renderSelectionIndicators());

    return () => {
      canvas.off('mouse:move', handleMouseMove);
      awareness.off('change', onAwarenessChange);
    }
  }, [canvas]);

  return { users, cursorsRef };
}