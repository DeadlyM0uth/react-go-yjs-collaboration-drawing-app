import { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import { provider, ydoc } from '../collaboration/yjs';


// Create SVG pattern for dotted grid
function createSVGDottedGrid() {
  const spacing = 20;
  const dotSize = 1;
  
  const svg = `
    <svg width="${spacing}" height="${spacing}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${spacing/2}" cy="${spacing/2}" r="${dotSize}" fill="#ccc"/>
    </svg>
  `;
  
  return 'data:image/svg+xml,' + encodeURIComponent(svg);
}


export const useCanvasInit = (canvasRef: React.RefObject<HTMLCanvasElement | null>) => {
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null);
  const isDraggingRef = useRef(false);
  const lastPosXRef = useRef(0);
  const lastPosYRef = useRef(0);

  useEffect(() => {
    const resizeCanvas = (canvasInstance: fabric.Canvas) => {
      canvasInstance.setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    if (canvasRef.current) {
      const initCanvas = new fabric.Canvas(canvasRef.current, {
        backgroundColor: '#fff',
        selection: true,
        width: window.innerWidth,
        height: window.innerHeight,
        preserveObjectStacking: true,
      });

      const img = new window.Image();
      img.src = createSVGDottedGrid();
      img.onload = () => {
        const pattern = new fabric.Pattern({
          source: img,
          repeat: 'repeat',
        });
        initCanvas.set('backgroundColor', pattern);
        initCanvas.requestRenderAll();
      };
      
      setCanvas(initCanvas);

      const handleResize = () => resizeCanvas(initCanvas);
      window.addEventListener('resize', handleResize);

      // Обработчики событий canvas
      initCanvas.on('mouse:wheel', (opt: any) => {
        const delta = opt.e.deltaY;
        let zoom = initCanvas.getZoom();
        zoom *= 0.999 ** delta;
        zoom = Math.min(Math.max(zoom, 0.5), 10);
        const point = new fabric.Point(opt.e.offsetX, opt.e.offsetY)
        initCanvas.zoomToPoint(point, zoom);
        opt.e.preventDefault();
        opt.e.stopPropagation();
      });

      initCanvas.on('mouse:down', (opt: any) => {
        // Если нажат Ctrl и нет активного объекта (или не над объектом)
        if (opt.e.ctrlKey) {
          isDraggingRef.current = true;
          lastPosXRef.current = opt.e.clientX;
          lastPosYRef.current = opt.e.clientY;
          initCanvas.selection = false;
        }
      });

      initCanvas.on('mouse:up', () => {
        isDraggingRef.current = false;
        initCanvas.selection = true;
        initCanvas.defaultCursor = '';
      });

      initCanvas.on('mouse:move', (opt: any) => { 
        if (isDraggingRef.current) {
          const e = opt.e;
          const vpt = initCanvas.viewportTransform;
          if (vpt) {
            vpt[4] += e.clientX - lastPosXRef.current;
            vpt[5] += e.clientY - lastPosYRef.current;
            initCanvas.requestRenderAll();
            lastPosXRef.current = e.clientX;
            lastPosYRef.current = e.clientY;
          }
        } else {
          // Устанавливаем курсор grab только если Ctrl нажат и нет активного объекта
          if (opt.e.ctrlKey ) {
            initCanvas.defaultCursor = 'grab';
          } else {
            initCanvas.defaultCursor = '';
          }
        }
      });

      return () => {
        initCanvas.dispose();
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  

  return { canvas };
};