import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { initYjsConnection, provider, ydoc } from "./yjs";
import App from "../App";

export default function YjsGate() {
  const [ready, setReady] = useState(false);
  const {id: boardId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      console.log("unmounted")
      provider?.disconnect();
      ydoc?.destroy();
    };
  }, []);

  useEffect(() => {
    const validateAndInit = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/validate", {
          method: "GET",
          credentials: "include",
        });
        if(res.ok) {
          initYjsConnection(boardId); // <-- передаем boardId как roomName
          setReady(true);
        } else {
          navigate("/login");
        }
      } catch {
        navigate("/login");
      }
    };
    validateAndInit();
  }, [navigate, boardId]);

  if (!ready) return <div>Loading...</div>;
  return <App />;
}