import { useState, useEffect } from "react";
import * as fabric from 'fabric';

import { awareness } from "../collaboration/yjs";

type ToolType = "select" | "rect" | "circle" | "freehand" | "text";

interface PropertiesPanelProps {
  canvas: fabric.Canvas | null;
  syncToYjs: (object: fabric.FabricObject) => void;
  selectedObject: fabric.FabricObject | null;
  setSelectedObject: (object: fabric.FabricObject | null) => void;
  tool:  ToolType;
}

function PropertiesPanel({canvas, syncToYjs, tool, selectedObject, setSelectedObject}: PropertiesPanelProps) {
  const [width, setWidth] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [Round, setRound] = useState<string>("");
  const [diameter, setDiameter] = useState<string>("");
  const [strokeWidth, setStrokeWidth] = useState<string>("");
  const [strokeColor, setStrokeColor] = useState<string>("#000000");
  const [opacity, setOpacity] = useState<string>("");
  const [fillColor, setFillColor] = useState<string>("#ffffff");
  const [fontFamily, setFontFamily] = useState<string>("");
  const [fontSize, setFontSize] = useState<string>("");
  const [fontStyle, setFontStyle] = useState<string>("");
  const [fontAligment, setFontAlign] = useState<string>("");
  const [brushColor, setBrushColor] = useState<string>("#000000");
  const [brushWidth, setBrushWidth] = useState<number>(5);
  const [name, setName] = useState<string>("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" && canvas) {
        const objects = canvas.getActiveObjects();
        if (objects.length > 0) {
          objects.forEach((object) => canvas.remove(object));
          canvas.discardActiveObject();
          setSelectedObject(null);
          clearSettings();
          canvas.requestRenderAll();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canvas]);



  const handleObjectSelection = (object: fabric.FabricObject) => {
    if (!object) return;
    setSelectedObject(object);

    if (object.type === "rect") {
      const rect = object as fabric.Rect;
      setWidth(Math.round(rect.width * rect.scaleX).toString());
      setHeight(Math.round(rect.height * rect.scaleY).toString());
      setStrokeWidth(rect.strokeWidth.toString());
      setStrokeColor(rect.stroke?.toString() || "#000000");
      setOpacity(rect.opacity?.toString() || "");
      setFillColor(rect.fill?.toString() || "#ffffff");
      setRound(rect.rx?.toString());
    }
    if (object.type === "circle") {
      const circle = object as fabric.Circle;
      setDiameter(Math.round(circle.radius * 2 * circle.scaleX).toString());
      setStrokeWidth(circle.strokeWidth.toString());
      setStrokeColor(circle.stroke?.toString() || "#000000");
      setOpacity(circle.opacity?.toString() || "");
      setFillColor(circle.fill?.toString() || "#ffffff");
    }
    if (object.type === "path") {
      setStrokeWidth(object.strokeWidth.toString());
      setStrokeColor(object.stroke?.toString() || "#000000");
      setOpacity(object.opacity?.toString() || "");
    }
    if (object.type === "textbox") {
      const text = object as fabric.Textbox;
      setFontSize(text.fontSize.toString());
      setFontStyle(text.fontStyle);
      setFillColor(text.fill?.toString() || "#000000");
      setFontAlign(text.textAlign)
      setFontFamily(text.fontFamily);
      setStrokeColor(text.stroke?.toString() || "#000000");
      setStrokeWidth(text.strokeWidth.toString());
      setOpacity(object.opacity?.toString() || "");
    }

    setName(object.name!);
  };

  useEffect(() => {
    if (canvas) {
      canvas.isDrawingMode = tool === "freehand";
      if (tool === "freehand") {
        const brush = new fabric.PencilBrush(canvas);
        brush.color = brushColor;
        brush.width = brushWidth;
        canvas.freeDrawingBrush = brush;
      }
    }
  }, [canvas, tool, brushColor, brushWidth]);

  useEffect(() => {
    if (canvas) {
      const handleSelection = (e: { selected?: fabric.FabricObject[] }) => {
        if (e.selected?.[0]) {
          handleObjectSelection(e.selected[0]);

          awareness.setLocalStateField('selection', {
            objectId: e.selected?.[0].id
          })
        }
      };

      canvas.on("selection:created", handleSelection);
      canvas.on("selection:updated", handleSelection);
      canvas.on("object:modified", (e) => handleObjectSelection(e.target));
      canvas.on("object:scaling", (e) => handleObjectSelection(e.target));
      canvas.on("selection:cleared", () => {
        setSelectedObject(null);
        clearSettings();
        awareness.setLocalStateField('selection', {
          objectId: null,
        })
      });

      return () => {
        canvas.off("selection:created", handleSelection);
        canvas.off("selection:updated", handleSelection);
        canvas.off("object:modified", handleObjectSelection);
        canvas.off("object:scaling", handleObjectSelection);
        canvas.off("selection:cleared", () => {
          setSelectedObject(null);
          clearSettings();
        });
      };
    }
  }, [canvas]);
  
  
  const clearSettings = () => {
    setWidth("");
    setHeight("");
    setDiameter("");
    setStrokeWidth("");
    setStrokeColor("#000000");
    setOpacity("");
    setFillColor("#ffffff");
  };

  // Input handlers with proper TypeScript types
  const handleFillColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setFillColor(color);
    if (selectedObject) {
      selectedObject.set({ fill: color });
      canvas?.requestRenderAll();
      syncToYjs(selectedObject); // Sync changes to Yjs
    }
  };

  const handleStrokeColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setStrokeColor(color);
    if (selectedObject) {
      if (selectedObject.type === "textbox")
        selectedObject.set({ stroke: color});
      else{
        console.log(color);
        selectedObject.set({ stroke: color});
      }
      canvas?.requestRenderAll();
      syncToYjs(selectedObject); // Sync changes to Yjs
    }
  };

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const opacity = e.target.value;
    setOpacity(opacity);
    if (selectedObject) {
      selectedObject.set({ opacity: parseFloat(opacity) });
      canvas?.requestRenderAll();
      syncToYjs(selectedObject);
    }
  };

  const handleStrokeWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const width = e.target.value;
    setStrokeWidth(width);
    if (selectedObject) {
      selectedObject.set({ strokeWidth: parseFloat(width) });
      canvas?.requestRenderAll();
      syncToYjs(selectedObject);
    }
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const width = e.target.value;
    setWidth(width);
    if (selectedObject && selectedObject.type === "rect") {
      const rect = selectedObject as fabric.Rect;
      rect.set({ width: parseFloat(width) / rect.scaleX });
      canvas?.requestRenderAll();
      syncToYjs(selectedObject);
    }
    if (selectedObject && selectedObject.type === "text-box") {
      const text = selectedObject as fabric.IText;
      text.set({width: parseFloat(width)/ text.scaleX})
      canvas?.requestRenderAll();
      syncToYjs(selectedObject);
    }
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const height = e.target.value;
    setHeight(height);

    if (selectedObject && selectedObject.type === "rect") {
      const rect = selectedObject as fabric.Rect;
      rect.set({ height: parseFloat(height) / rect.scaleY });
      canvas?.requestRenderAll();
      syncToYjs(selectedObject);
    }
  };

  const handleRoundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const r = e.target.value;
    setRound(r);
    if (selectedObject) {
      const rect = selectedObject as fabric.Rect;
      rect.set({rx: parseInt(r), ry: parseInt(r)})
      syncToYjs(selectedObject);
    }
  }

  const handleDiameterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const diameter = e.target.value;
    setDiameter(diameter);
    if (selectedObject && selectedObject?.type === "circle") {
      const circle = selectedObject as fabric.Circle;
      circle.set({ radius: parseFloat(diameter) / 2 / circle.scaleX });
      canvas?.requestRenderAll();
    }
  };

  const handleNoFill = () => {
    if (selectedObject) {
      selectedObject.set({ fill: "transparent" });
      canvas?.requestRenderAll();
      syncToYjs(selectedObject);
    }
  }

  const handleFontFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const font = e.target.value;
    setFontFamily(font)
    if (selectedObject) {
      selectedObject.set({fontFamily: font})
      canvas?.requestRenderAll();
      syncToYjs(selectedObject);
    }
  }

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const size = e.target.value;
    setFontSize(size);
    if (selectedObject) {
      selectedObject.set({fontSize: parseInt(size)})
      canvas?.requestRenderAll();
      syncToYjs(selectedObject);
    }
  }

  const handleFontAlignChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const align = e.target.value;
    setFontAlign(align)
    if (selectedObject) {
      selectedObject.set({textAlign: align})
      canvas?.requestRenderAll();
      syncToYjs(selectedObject);
    }
  }

  const handleFontStyleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const style = e.target.value;
    setFontStyle(style)
    if (selectedObject) {
      selectedObject.set({fontStyle: style})
      canvas?.requestRenderAll();
      syncToYjs(selectedObject);
    }
  }  

  const handleDelete = () => {
    if (selectedObject) {
      canvas?.remove(selectedObject);
      canvas?.discardActiveObject();
      setSelectedObject(null);
      clearSettings();
    }  
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    if (selectedObject) {
      selectedObject.set({name: name})
      setName(name)
      syncToYjs(selectedObject);
    }
  }
  
  return (
    ((selectedObject || tool === "freehand") && <div className="fixed top-0 right-0 h-full w-64 bg-gray-50 shadow-md z-10 p-4 border-l border-gray-200">
      <h2 className="font-semibold text-gray-700 mb-4">Свойства</h2>
      {tool === "freehand" && (
        <div className="space-y-3 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Цвет кисти</label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={brushColor}
                onChange={(e) => setBrushColor(e.target.value)}
                className="h-10 w-10 cursor-pointer rounded-full border-2 border-black border"
              />
              <input
                type="text"
                value={brushColor}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^#([0-9A-Fa-f]{0,6})$/.test(value)) {
                    setBrushColor(value);
                  }
                }}
                maxLength={7}
                className="w-20 p-1 border border-gray-300 rounded text-sm font-mono"
                placeholder="#000000"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Толщина кисти</label>
            <input
              type="range"
              value={brushWidth}
              onChange={(e) => setBrushWidth(Number(e.target.value))}
              min="1"
              max="50"
              className="w-full accent-black"
            />
            <div className="text-xs text-gray-500 text-right">{brushWidth}px</div>
          </div>
        </div>
      )}

      {selectedObject && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              className="w-full p-1 border border-gray-300 rounded text-sm"
            />
          </div>
          {/* Свойства для фигур */}
          {selectedObject.type === "rect" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ширина</label>
                <input 
                  type="number" 
                  value={width} 
                  onChange={handleWidthChange}
                  className="w-full p-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Высота</label>
                <input 
                  type="number" 
                  value={height} 
                  onChange={handleHeightChange}
                  className="w-full p-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Радиус скругления</label>
                <input 
                  type="number" 
                  value={Round} 
                  onChange={handleRoundChange}
                  className="w-full p-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>
          )}

          {selectedObject.type === "circle" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Диаметр</label>
              <input 
                type="number" 
                value={diameter} 
                onChange={handleDiameterChange}
                className="w-full p-1 border border-gray-300 rounded text-sm"
              />
            </div>
          )}

          {selectedObject.type === "textbox" && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Размер шрифта</label>
                <input
                  type="number"
                  value={fontSize}
                  onChange={handleFontSizeChange}
                  className="w-full p-1 border border-gray-300 rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Шрифт</label>
                <select
                  value={fontFamily}
                  onChange={handleFontFamilyChange}
                  className="w-full p-1 border border-gray-300 rounded text-sm"
                >
                  <option value="Arial">Arial</option>
                  <option value="Helvetica">Helvetica</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Verdana">Verdana</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Стиль шрифта</label>
                <select
                  value={fontStyle}
                  onChange={handleFontStyleChange}
                  className="w-full p-1 border border-gray-300 rounded text-sm"
                >
                  <option value="normal">Обычный</option>
                  <option value="bold">Жирный</option>
                  <option value="italic">Курсив</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Выравнивание текста</label>
                <select
                  value={fontAligment}
                  onChange={handleFontAlignChange}
                  className="w-full p-1 border border-gray-300 rounded text-sm"
                >
                  <option value="left">Влево</option>
                  <option value="center">По центру</option>
                  <option value="right">Вправо</option>
                  <option value="justify">По ширине</option>
                </select>
              </div>
            </div>
          )}

          {/* Общие свойства */}
          <div className="space-y-3 pt-2 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Толщина обводки</label>
              <input 
                type="number" 
                value={strokeWidth} 
                onChange={handleStrokeWidthChange}
                className="w-full p-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Цвет обводки</label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={strokeColor}
                onChange={handleStrokeColorChange}
                className="h-10 w-10 cursor-pointer rounded-full border-2 border-black "
              />
              <input
                type="text"
                value={strokeColor}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^#([0-9A-Fa-f]{0,6})$/.test(value)) {
                    handleStrokeColorChange(e)
                  }
                }}
                maxLength={7}
                className="w-20 p-1 border border-gray-300 rounded text-sm font-mono"
                placeholder="#000000"
              />
            </div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Цвет заливки</label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={fillColor}
                onChange={handleFillColorChange}
                className="h-10 w-10 cursor-pointer rounded-full border-2 border-black"
              />
              <input
                type="text"
                value={fillColor}
                onChange={(e) => {
                  const value = e.target.value;
                  if (/^#([0-9A-Fa-f]{0,6})$/.test(value)) {
                    handleFillColorChange(e);
                  }
                }}
                maxLength={7}
                className="w-20 p-1 border border-gray-300 rounded text-sm font-mono"
                placeholder="#000000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Прозрачность</label>
              <input 
                type="range" 
                value={opacity} 
                onChange={handleOpacityChange} 
                step="0.1" 
                min="0" 
                max="1"
                className="w-full accent-black"
              />
              <div className="text-xs text-gray-500 text-right">{Math.round(parseFloat(opacity) * 100)}%</div>
            </div>
          </div>

          <div className="flex space-x-2 pt-2">
            <button 
              className="flex-1 py-1.5 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 transition-colors"
              onClick={handleNoFill}
            >
              Без заливки
            </button>
            <button
              className="flex-1 py-1.5 bg-red-100 text-red-600 rounded text-sm hover:bg-red-200 transition-colors"
              onClick={handleDelete}
            >
              Удалить
            </button>
          </div>
        </div>
      )}
    </div>)
  );
}


export default PropertiesPanel;