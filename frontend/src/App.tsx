import * as fabric from 'fabric'
import ToolsPanel from './components/ToolsPanel';
import LayersPanel from './components/LayersPanel';
import { useRef, useEffect, useState } from 'react';

type ToolType = "select" | "rect" | "circle" | "freehand" | "text";

declare module 'fabric' {
  interface FabricObject {
    id?: string;
    name?: string;
    isCursor?: boolean;
    isSelectionIndicator?: boolean;
    transformMatrix?: fabric.TMat2D;
  }

  interface SerializedObjectProps {
    id?: string;
    isCursor?: boolean;
    name?: string;
    isSelectionIndicator?: boolean;
    transformMatrix?: fabric.TMat2D;
  }
}
fabric.FabricObject.customProperties = ['id', 'isCursor', 'isSelectionIndicator', "name", "transformMatrix"];

import PropertiesPanel from './components/PropertiesPanel';
import { useCanvasInit } from './hooks/useCanvasInit';
import { useAwareness } from './hooks/useAwareness';
import { useYjsSync } from './hooks/useYjsSync';
import { useNavigate } from 'react-router-dom';



function App() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {canvas} = useCanvasInit(canvasRef); 
  const { users, cursorsRef } = useAwareness(canvas);
  const {syncToYjs} = useYjsSync(canvas, cursorsRef);

  const [objects, setObjects] =useState<fabric.FabricObject[] | null>(null);
  const [tool, setTool] = useState<ToolType>("select");

  const [selectedObject, setSelectedObject] = useState<fabric.FabricObject | null>(null);

  useEffect(() => {
    const validate = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/validate", {
          method: "GET",
          credentials: "include",
        });
        if (!res.ok) {
          navigate("/login");
        }
      } catch {
        navigate("/login");
      }
    }
    validate();
  }, [navigate]);

  useEffect(() => {
    if (canvas) {
      let isDrawing = false;
      let shape: fabric.FabricObject | null = null;

      const handleMouseDown = (opt: any) => {
        const pointer = canvas.getScenePoint(opt.e);
        isDrawing = true;

        if (tool === "select") {
          canvas.selection = true;
          return;
        }
        canvas.selection = false;
        
        if (pointer && tool === "rect") {
          shape = new fabric.Rect({
            left: pointer.x,
            top: pointer.y,
            width: 20,
            height: 20,
            fill: "#ff1100",
            strokeWidth: 0,
            strokeUniform: true,
            stroke: "#000000",
            id: Date.now().toString(),
            name: "rect",
          });

          shape.on("scaling", (opt) => {
            const rect = opt.transform.target; 
            rect.set({
              width: rect.width * rect.scaleX,
              height: rect.height * rect.scaleY,
              scaleX: 1,
              scaleY: 1
            })
          })
          canvas.add(shape);
        } else if (pointer && tool === "circle") {
          shape = new fabric.Circle({
            left: pointer.x,
            top: pointer.y,
            radius: 20,
            fill: "#003cff",
            strokeWidth: 0,
            strokeUniform: true,
            stroke: "#000000",
            id: Date.now().toString(),
            name: "circle",
          });
          canvas.add(shape);
        } else if (pointer && tool === "text") {
          shape = new fabric.Textbox("Type here", {
            left: pointer.x,
            top: pointer.y,
            fontSize: 28,
            fill: "#000000",
            lockScalingY: true,
            textAlign: "left", //"left", "center", "right" or "justify".
            id: Date.now().toString(),
            name: "text",
            opacity: 1,
          });
          console.log(shape.type)
          canvas.add(shape);
          setTool("select");
          isDrawing = false;
        }
      };

      const handleMouseMove = (opt: any) => {
        // setCoords(canvas.getScenePoint(opt.e));
        if (!isDrawing || !shape) return;
        const pointer = canvas.getScenePoint(opt.e);

        if (pointer) {
          if (tool === "rect") {
            shape.set({
              width: pointer.x - shape.left,
              height: pointer.y - shape.top,
            });
          } else if (tool === "circle") { 
            const radius = Math.sqrt(
              Math.pow(pointer.x - shape.left, 2) +
              Math.pow(pointer.y - shape.top, 2)
            );
            shape.set({ radius });
          }
          canvas.requestRenderAll();
        }
      };

      const handleMouseUp = () => {
        isDrawing = false;
        canvas.selection = true;
        if (tool !== 'freehand')
          setTool("select");
        if (shape)  {
          shape.setCoords();
          syncToYjs(shape);
        } 
        shape = null;
      };

      canvas.on("mouse:down", handleMouseDown);
      canvas.on("mouse:move", handleMouseMove);
      canvas.on("mouse:up", handleMouseUp);
      canvas.on("before:path:created", (e) => {
        const path = e.path;
        path.name = "path"
      })

      return () => {
        canvas.off("mouse:down", handleMouseDown);
        canvas.off("mouse:move", handleMouseMove);
        canvas.off("mouse:up", handleMouseUp);
      };
    }
  }, [canvas, tool]);


  useEffect(() => {
    if (canvas) {

      canvas.isDrawingMode = tool === "freehand";
      if (tool === "freehand") {
        canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
        canvas.freeDrawingBrush.color = "#000000";
        canvas.freeDrawingBrush.width = 5;
      }
    }
  }, [canvas, tool]);

  useEffect(() => {
    if (canvas) {
      setObjects([...canvas.getObjects()].reverse());

      const updateObjects = () => setObjects([...canvas.getObjects()].reverse());
      canvas.on("object:added", updateObjects);
      canvas.on("object:removed", updateObjects);

      return () => {
        canvas.off("object:added", updateObjects);
        canvas.off("object:removed", updateObjects);
      };
    }
  }, [canvas]);

  return (
    <div className="flex-1 relative min-h-screen bg-gray-100">
      

      {/* Left Sidebar - Tools Panel */}
      <ToolsPanel tool={tool} setTool={setTool}/>

      {/* Layers Panel */}
      <LayersPanel 
        canvas={canvas} 
        users={users} 
        objects={objects} 
        cursorsRef={cursorsRef} 
        selectedObject={selectedObject} 
        syncToYjs={syncToYjs} 
        setObjects={setObjects} 
      />

      {/* Right Sidebar - Properties Panel */}
      <PropertiesPanel 
        canvas={canvas} 
        syncToYjs={syncToYjs} 
        selectedObject={selectedObject}
        setSelectedObject={setSelectedObject}
        tool={tool} 
      />

      {/* Canvas Area */}
      <div className="fixed top-0 left-0 w-screen h-screen">
        <canvas
          id="canvas"
          className="absolute top-0 left-0 w-full h-full shadow-sm"
          ref={canvasRef}
        />
      </div>
      {/* <div className='fixed top-0 left-[50%] z-50'>x:{coords?.x} y:{coords?.y}</div> */}
    </div>
  );
}

export default App
