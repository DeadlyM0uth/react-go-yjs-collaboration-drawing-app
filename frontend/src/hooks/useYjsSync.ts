import { useEffect, useState } from 'react';
import * as fabric from 'fabric';
import { yobjects } from "../collaboration/yjs";
import throttle from 'lodash.throttle';

export const useYjsSync = (
  canvas: fabric.Canvas | null,
  cursorsRef: React.RefObject<Map<string, fabric.Group>>
) => {
  const [isRemoteUpdate, setIsRemoteUpdate] = useState(false);

  const syncToYjs = (obj: fabric.FabricObject) => {
    if (obj.type === 'activeselection') {
      const activeSelection = obj as fabric.ActiveSelection;
      activeSelection.getObjects().forEach((obj: fabric.FabricObject) => {
        const matrix = obj.calcTransformMatrix();
        // var options = fabric.util.qrDecompose(matrix);
        const objData = obj.toObject();
        objData.matrix = matrix;
        yobjects?.set(obj.id!, objData);   
      })
    } else {
      const objData = obj.toObject();
      yobjects?.set(obj.id!, objData);  
    }
  };

  const throttledSyncToYjs = throttle((obj: fabric.FabricObject) => {
    if (isRemoteUpdate) return;
    syncToYjs(obj)
  }, 50);

  const loadObjectToCanvas = (objData: any) => {
    fabric.util.enlivenObjects<fabric.FabricObject>([objData]).then((objects) => {
      objects.forEach((obj) => {
        const existing = canvas?.getObjects().find(o => o.id === obj.id);
        if (!existing) {
          console.log("loading canvas object")
          obj.id = objData.id;
          canvas?.add(obj);
          obj.setCoords();
        }
      });
    });
    canvas?.requestRenderAll();
  }
  
  const updateCanvasObject = (id: string, newData: any) => {
    const obj = canvas?.getObjects().find(o => o.id === id);
    if (obj) {
      const {type, ...rest} = newData;
      const currentData = obj.toObject();
      const matrix = newData.matrix 
      newData.matrix = null;
      if (JSON.stringify(currentData) === JSON.stringify(newData)) {
        return;
      }
      console.log("updating canvas object")
      obj.set(rest);
      if (matrix) {
        fabric.util.applyTransformToObject(obj, matrix);
      }
      obj.setCoords();
      canvas?.requestRenderAll();
    }
  }

  // const updateOrderInYjs = () => {
  //   if (!canvas) return;
  //   const ids = canvas.getObjects()
  //     .filter(obj => !obj.isCursor && !obj.isSelectionIndicator)
  //     .map(obj => obj.id)
  //     .filter((id): id is string => typeof id === 'string');

  //   yorder.delete(0, yorder.length); // clear
  //   yorder.insert(0, ids);
  // };


  useEffect(() => {
    if (!canvas) return;
  
    const handleAdd = (e: any) => {
      cursorsRef.current.forEach((cursor) => {
        canvas?.bringObjectToFront(cursor);
      })
      if (isRemoteUpdate || e.target.isCursor || e.target.isSelectionIndicator) return;
      const obj = e.target!;
      if (obj.type === 'activeselection') return;
      obj.id = obj.id || Date.now().toString();
      syncToYjs(obj);
    };
    
    const handleUpdate = (e: fabric.ModifiedEvent) => {
      cursorsRef.current.forEach((cursor) => {
        canvas?.bringObjectToFront(cursor);
      })
      if (isRemoteUpdate || e.target.isSelectionIndicator) return;
      const obj = e.target!;
      console.log("sending update")
      syncToYjs(obj);
    };
    
    const handleMoveOrScale = (e: any) => {
      if (isRemoteUpdate || e.target.isSelectionIndicator) return;
      const obj = e.target!;
      console.log("sending move/scale");
      throttledSyncToYjs(obj);
    }

    const handleRemove = (e: any) => {
      cursorsRef.current.forEach((cursor) => {
        canvas?.bringObjectToFront(cursor);
      })
      if (isRemoteUpdate || e.target.isSelectionIndicator || e.target.isCursor) return;
      const obj = e.target!;
      console.log("sending remove")
      if (obj.type === 'activeselection') {
        const activeSelection = obj as fabric.ActiveSelection;
        activeSelection.getObjects().forEach((obj: fabric.FabricObject) => {
          yobjects?.delete(obj.id!);
        })
      } else {
        yobjects?.delete(obj.id!);
      }
    }

    // yorder.observe(() => {
    //   if (!canvas) return;
    //   const ids = yorder.toArray();
    //   ids.forEach((id: string) => {
    //     const obj = canvas.getObjects().find(o => o.id === id);
    //     if (obj) canvas.bringObjectToFront(obj);
    //   });
    //   canvas.requestRenderAll();
    // });


    canvas.on('object:added', handleAdd);
    canvas.on('object:modified', handleUpdate);
    canvas.on('object:removed', handleRemove);
    canvas.on("object:moving", handleMoveOrScale);
    canvas.on("object:scaling", handleMoveOrScale);
    canvas.on("object:rotating", handleMoveOrScale);
    canvas.on("text:changed", handleUpdate);
    // canvas.on('object:added', updateOrderInYjs);
    // canvas.on('object:removed', updateOrderInYjs);

    yobjects?.observe((e, transaction)=> {
      if (transaction.local) return;
      setIsRemoteUpdate(true);
      e.changes.keys.forEach((change, id) => {
        if (change.action === 'delete') {
          const obj = canvas.getObjects().find(o => o.id === id);
          if (obj) canvas.remove(obj);
        } else if (change.action === 'add') {
          const objData = yobjects?.get(id);
          loadObjectToCanvas(objData);
        } else if (change.action === 'update') {
          const objData = yobjects?.get(id);
          updateCanvasObject(id, objData);
          // console.log(transaction);
        }
      });

      setIsRemoteUpdate(false);
    });

    yobjects?.forEach((objData: any) => {
      loadObjectToCanvas(objData);
    });

    return () => {
      canvas.off('object:added', handleAdd);
      canvas.off('object:modified', handleUpdate);
      canvas.off('object:removed', handleRemove);
      canvas.off('object:moving', handleMoveOrScale);
      canvas.off("object:scaling", handleMoveOrScale);
      canvas.off("object:rotating", handleMoveOrScale);
    };
  }, [canvas]);

  return { syncToYjs: throttledSyncToYjs };
};