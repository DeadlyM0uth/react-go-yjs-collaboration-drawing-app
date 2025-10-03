import * as fabric from "fabric";
  import React, { useEffect, useState } from "react";
  import { ArrowFatUp, ArrowFatDown, MapPin, Eye, EyeSlash, X } from '@phosphor-icons/react';
  import { roomId } from "../collaboration/yjs";

  interface User {
    id: number;
    name: string;
    email: string;
    color: string;
  }

  interface LayersPanelProps {
    canvas: fabric.Canvas | null;
    objects: fabric.FabricObject[] | null;
    setObjects: (objects: fabric.FabricObject[]) => void;
    users: User[];
    selectedObject: fabric.FabricObject | null;
    syncToYjs: (object: fabric.FabricObject) => void;
    cursorsRef: React.RefObject<Map<string, fabric.Group>>;
  }

  function LayersPanel({canvas, objects, setObjects, users, selectedObject, syncToYjs, cursorsRef}: LayersPanelProps) {

    const [showInviteModal, setShowInviteModal] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [invitedUsers, setInvitedUsers] = useState<{ID:number, Name: string, Email: string}[] | null>(null); 
    const [owner, setOwner] = useState<{ID:number, Name: string, Email: string} | null>(null); 

    const handleBringForward = () => {
      if (selectedObject) {
        canvas?.bringObjectForward(selectedObject);
        const objects = canvas?.getObjects() || [];
        setObjects([...objects.reverse()]);

        cursorsRef.current.forEach((cursor) => {
            canvas?.bringObjectToFront(cursor);
        })
      }
    }

    const handleBringBackwards = () => {
      if (selectedObject) {
        canvas?.sendObjectBackwards(selectedObject);
        const objects = canvas?.getObjects() || [];
        setObjects([...objects.reverse()]);

        cursorsRef.current.forEach((cursor) => {
            canvas?.bringObjectToFront(cursor);
        })
      }
    }

    const handleGoToObject = () => {
      if (selectedObject && canvas) {
        const zoom = canvas.getZoom();
        const center = selectedObject.getCenterPoint();
        canvas.setViewportTransform([
            zoom, 0, 0, zoom,
            -center.x * zoom + canvas.width / 2,
            -center.y * zoom + canvas.height / 2
        ]);
        canvas.requestRenderAll();
      }
    }

    const getInvitedUsers = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/boards/${roomId}/users`, {
          method: "GET",
          credentials: "include",
          headers: {"Content-type": "application/json"}
        });
        if (res.ok) {
          const data = await res.json();
          setOwner(data.owner);
          setInvitedUsers(data.invited)
          console.log(data);
        }
      } catch (error) {
        console.error(error);
      }
    } 

    const handleInvite = async () => {
      setInviteError(null);
      if (!inviteEmail.trim()) {
        setInviteError("Email is required");
      }
      try {
        const res = await fetch("http://localhost:8080/api/boards/invite", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ board_id: roomId, email: inviteEmail }),
        })
        if (res.ok) {
          setShowInviteModal(false);
          setInviteEmail("");
          getInvitedUsers();
        } else {
          const data = await res.json();
          setInviteError(data.error || "Failed to invite user");
        }
      } catch {
        setInviteError("Failed to invite user");
      } 
    }

    const handleRemoveUser = async (userId: number) => {
      const isConfirmed = window.confirm("Are you sure you want to remove this user?");
      if (!isConfirmed) return;
      const userToRemove = users.find(u => u.id === userId);
      if (!userToRemove) return;
      try {
        console.log(userToRemove)
        await fetch("http://localhost:8080/api/boards/remove-user", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ board_id: roomId, user_id: userToRemove.id }),
        });
      } catch {}
      getInvitedUsers();
    };


    useEffect(() => {
      console.log("useEffect called");
      getInvitedUsers();
    }, [])

    return (
      <div className="fixed top-0 left-16 h-full w-64 bg-gray-50 shadow-md z-10 flex flex-col p-4 border-r border-gray-200">
        <h3 className="font-semibold text-gray-700 mb-2">Слои</h3>
        <div className="flex space-x-2 mb-3">
          <button
            className="px-2 py-1 shadow-md bg-white text-blue-600 rounded text-sm hover:bg-gray-300 transition-colors"
            onClick={handleBringForward}
          >
            <ArrowFatUp size={24} color="#000" weight="regular" />
          </button>
          <button
            className="px-2 py-1 shadow-md bg-white text-blue-600 rounded text-sm hover:bg-gray-300 transition-colors"
            onClick={handleBringBackwards}
          >
            <ArrowFatDown size={24} color="#000" weight="regular" />
          </button>
          <button
            className="px-2 py-1 shadow-md bg-white text-white rounded text-sm hover:bg-gray-300 transition-colors"
            onClick={handleGoToObject}
          >
            <MapPin size={24} color="#000" weight="regular" />
          </button>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-300 flex-1 overflow-y-auto h-1/3 bm-4" >
          <ul className="divide-y divide-gray-200">
            {canvas && objects?.filter((object) => !object.isCursor && !object.isSelectionIndicator).map((object, index) => (
            <li
              key={index}
              className={`p-2 flex items-center justify-between hover:bg-blue-50 ${
              selectedObject === object ? 'bg-gray-200' : ''
              }`}
              onClick={() => {
              canvas.setActiveObject(object);
              canvas.requestRenderAll();
              }}
            >
              <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700 capitalize">{object.name}</span>
              </div>
              <button
                className="p-1 rounded-full hover:bg-gray-200"
                onClick={(e) => {
                    e.stopPropagation();
                    object.set({ visible: !object.visible });
                    canvas.requestRenderAll();
                    setObjects([...canvas.getObjects()].reverse());
                    syncToYjs(object);
                }}
              >
                {object.visible ? (
                    <span className="text-gray-400"><Eye size={24} weight="fill"/></span>
                ) : (
                    <span className="text-gray-400"><EyeSlash size={24} weight="fill" /></span>
                )}
              </button>
            </li>
            ))}
          </ul>
        </div>

        {/* Users section with scrollable panel */}
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-2 mt-2">
            <h3 className="font-semibold text-gray-700">Участники</h3>
            <button 
              className="px-2 shadow py-1 bg-white text-black rounded text-sm hover:bg-gray-300 transition-colors"
              onClick={() => setShowInviteModal(true)}
            >
              Пригласить
            </button>
          </div>
          <div className="bg-white rounded-lg border border-gray-300 flex-1 overflow-y-auto p-2">
            <ul className="space-y-2">
              {/* Owner */}
              {owner && (() => {
                const isActive = users.some(u => u.id === owner.ID);
                const color = users.find(u => u.id === owner.ID)?.color;
                return (
                  <li className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span
                        className="w-3 h-3 rounded-full mr-2"
                        style={{
                          backgroundColor: isActive ? color : "#bbb",
                          opacity: isActive ? 1 : 0.5,
                          border: isActive ? "none" : "1px solid #888"
                        }}
                      />
                      <span className={`text-sm font-semibold ${isActive ? "text-gray-600" : "text-gray-400"}`}>
                        {owner.Name} <span className="ml-1 text-xs">(владелец)</span>
                        {!isActive && <span className="ml-1 text-xs">(неактивен)</span>}
                      </span>
                    </div>
                  </li>
                );
              })()}

              {/* Invited users */}
              {invitedUsers?.map((user) => {
                const isActive = users.some(u => u.id === user.ID);
                const color = users.find(u => u.id === user.ID)?.color;
                return (
                  <li key={user.ID} className="flex items-center justify-between hover:bg-gray-100">
                    <div className="flex items-center">
                      <span
                        className="w-3 h-3 rounded-full mr-2"
                        style={{
                          backgroundColor: isActive ? color : "#bbb",
                          opacity: isActive ? 1 : 0.5,
                          border: isActive ? "none" : "1px solid #888"
                        }}
                      />
                      <span className={`text-sm ${isActive ? "text-gray-600" : "text-gray-400"}`}>
                        {user.Name}
                        {!isActive && <span className="ml-1 text-xs">(неактивен)</span>}
                      </span>
                    </div>
                    <button
                      className="ml-2 p-1 rounded-full text-gray-500 hover:bg-gray-300"
                      onClick={() => handleRemoveUser(user.ID)}
                      title="Удалить пользователя"
                    >
                      <X weight="bold"/>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Invite Modal */}
        {showInviteModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-white rounded-lg p-6 shadow-lg w-80">
              <h2 className="text-lg font-semibold mb-4">Пригласить участника</h2>
              <input
                type="email"
                className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
                placeholder="Введите email"
                value={inviteEmail}
                onChange={e => setInviteEmail(e.target.value)}
              />
              {inviteError && <div className="text-red-500 text-sm mb-2">{inviteError}</div>}
              <div className="flex justify-end gap-2">
                <button
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  onClick={() => setShowInviteModal(false)}
                >
                  Отмена
                </button>
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={handleInvite}
                >
                  Пригласить
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }



  export default LayersPanel