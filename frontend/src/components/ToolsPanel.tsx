import { Cursor, Square, Circle, PenNibStraight, TextT, FolderOpen, DownloadSimple, SignOut } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';

type ToolType = "select" | "rect" | "circle" | "freehand" | "text";

interface ToolsPanelProps {
    tool: ToolType;
    setTool: (tool: ToolType) => void;
}

function ToolsPanel({ tool, setTool}: ToolsPanelProps) {

    const navigate = useNavigate();

    const getButtonClass = (currentTool: ToolType) => {
        return `mb-2 p-2 text-white ${
            tool === currentTool ? 'bg-black' : 'bg-white'
        }`;
    };

    const getIconClass = (currentTool: ToolType) => {
        return tool===currentTool? 'fill-white':'fill-black';
    }

    return (
        <div className="fixed top-0 left-0 h-full w-16 text-white bg-black flex flex-col items-center py-4 z-20 shadow-lg">
            <div className="mb-6 text-center">
                <div className="text-xs font-semibold mb-1 text-gray-300"> </div>
                <div className="space-y-2">
                    <button
                        className={`p-2 rounded-lg border border-white ${getButtonClass("select")} hover:bg-gray-900 transition-colors`}
                        onClick={() => setTool("select")}
                        title="Select"
                    >
                        <Cursor size={24} weight="bold" className={`${getIconClass("select")} hover:fill-white`}/>
                    </button>
                    <button
                        className={`p-2 rounded-lg border border-white ${getButtonClass("rect")} hover:bg-gray-900 transition-colors`}
                        onClick={() => setTool("rect")}
                        title="Rectangle"
                    >
                        <Square size={24} weight="bold" className={`${getIconClass("rect")} hover:fill-white`}/>
                    </button>
                    <button
                        className={`p-2 rounded-lg border border-white ${getButtonClass("circle")} hover:bg-gray-900 transition-colors`}
                        onClick={() => setTool("circle")}
                        title="Circle"
                    >
                        <Circle size={24} weight="bold" className={`${getIconClass("circle")} hover:fill-white`}/>
                    </button>
                    <button
                        className={`p-2 rounded-lg border border-white ${getButtonClass("freehand")} hover:bg-gray-900 transition-colors`}
                        onClick={() => setTool("freehand")}
                        title="Freehand"
                    >
                        <PenNibStraight size={24} weight="fill" className={`${getIconClass("freehand")} hover:fill-white`}/>
                    </button>
                    <button
                        className={`p-2 rounded-lg border border-white ${getButtonClass("text")} hover:bg-gray-900 transition-colors`}
                        onClick={() => setTool("text")}
                        title="Text"
                    >
                        <TextT size={24} weight="fill" className={`${getIconClass("text")} hover:fill-white`} />
                    </button>
                </div>
            </div>
            <div className="mt-auto flex flex-col space-y-2">
                <button
                    className="p-2 rounded-lg border border-white bg-white text-black hover:bg-gray-200 transition-colors"
                    title="Undo"
                    onClick={() => {/* TODO: implement undo */}}
                >
                    <DownloadSimple size={24} ></DownloadSimple>
                </button>
                <button
                    className="p-2 rounded-lg border border-white bg-white text-black hover:bg-gray-200 transition-colors"
                    title="Redo"
                    onClick={() => {/* TODO: implement redo */}}
                >
                    <FolderOpen size={24} ></FolderOpen>
                </button>
                <button
                    className="p-2 rounded-lg border border-white bg-white text-black hover:bg-gray-200 transition-colors"
                    title="Redo"
                    onClick={() => {navigate("/dashboard")}}
                >
                    <SignOut size={24} ></SignOut>
                </button>
            </div>
        </div>
    );
}


export default ToolsPanel;