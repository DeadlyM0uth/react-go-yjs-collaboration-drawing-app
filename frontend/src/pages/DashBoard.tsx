import { Plus, SignOut, TrashSimple } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type User = {
  id: number;
  name: string;
  email: string;
};

function DashBoard() {
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false)
  const [showNewRoomModal, setShowNewRoomModal] = useState<boolean>(false)
  const [newRoomName, setNewRoomName] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'My' | 'Ivited'>("My");
  const [boards, setBoards] = useState<Array<{
    ID: number;
    Name: string;
    CreatorID: number;
    CreatedAt: string;
  }> | null>(null);

  const [invitedBoards, setInvitedBoards] = useState<Array<{
    ID: number;
    Name: string;
    CreatorID: number;
    CreatedAt: string;
  }> | null>(null);

  const handleLeaveBoard = async (id: number) => {
    if (!window.confirm("Are you sure you want to leave this board?")) return;
    
    try {
      const res = await fetch(`http://localhost:8080/api/boards/leave`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          board_id: id,
        })
      });

      if (res.ok) {
        // Update your state to remove the board from the user's list
        setBoards(prev => prev ? prev.filter(b => b.ID !== id) : prev);
        // Or if you have a separate list for invited boards:
        setInvitedBoards(prev => prev ? prev.filter(b => b.ID !== id) : prev);
      } else {
        const error = await res.json();
        alert(error.error || "Failed to leave board");
      }
    } catch (err) {
      alert("Failed to leave board");
      console.error(err);
    }
  };

  const handleSignOut = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/logout", {
        method: "POST",
        credentials: "include",
      });

      if (res.ok) {
        // Clear user data from your frontend state
        setUser(null);
        // Redirect to login page or home page
        window.location.href = "/login";
      } else {
        alert("Failed to sign out");
      }
    } catch (err) {
      alert("Failed to sign out");
      console.error(err);
    }
  };

  // Delete board handler
  const handleDeleteBoard = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this board?")) return;
    try {
      const res = await fetch(`http://localhost:8080/api/boards/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        setBoards((prev) => prev ? prev.filter(b => b.ID !== id) : prev);
      } else {
        alert("Failed to delete board");
      }
    } catch {
      alert("Failed to delete board");
    }
  };

  const handleCreateRoom = async () => {
    if (!newRoomName.trim()) return;
    try {
      const res = await fetch("http://localhost:8080/api/boards", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newRoomName }),
      });
      if (res.ok) {
        const newBoard = await res.json();
        setBoards(prev => prev ? [newBoard, ...prev] : [newBoard]);
        setShowNewRoomModal(false);
        setNewRoomName("");
      } else {
        alert("Failed to create board");
      }
    } catch {
      alert("Failed to create board");
    }
  };

  useEffect(() => {
    const getUsersBoards = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/boards/me", {
          method: "GET",
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setBoards(data);
        } 
      } catch {
        console.log("something went wrong")
        setBoards(null)
      }
    }

    const getInvitedBoards = async () => {
      try {
        const res = await fetch("http://localhost:8080/api/boards/invited", {
          method: "GET",
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setInvitedBoards(data);
        }
      } catch {
        setInvitedBoards(null);
      }
    };

    getUsersBoards();
    getInvitedBoards();

    const user = JSON.parse(localStorage.getItem('user')!); 
    setUser(user)
    setUserName(user.name)
    setUserEmail(user.email)
  }, []);

  // Format date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <div className="flex h-screen bg-white text-black">
      {/* Левая панель */}
      <div className="flex flex-col w-64 bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200 h-15">
          <h1 className="text-xl font-bold">Доски</h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Навигация */}
          <nav className="p-2">
            <button
              className={`flex items-center w-full p-3 rounded-lg ${activeTab === 'My' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
              onClick={() => setActiveTab("My")}
            >
              Мои доски
            </button>
            <button
              className={`flex items-center w-full p-3 rounded-lg ${activeTab === 'Ivited' ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
              onClick={() => setActiveTab("Ivited")}
            >
              Приглашения
            </button>
          </nav>
        </div>
        {/* Профиль */}
        <div className="p-4 border-t border-gray-200 flex">
          <button 
            onClick={() => setShowProfileModal(true)}
            className="flex items-center w-full p-2 hover:bg-gray-100 rounded-lg"
          >
            <img 
              src={"https://placehold.co/50"} 
              alt="Профиль" 
              className="w-8 h-8 rounded-full mr-3"
            />
            <div className="text-left">
              <div className="font-medium">{user?.name}</div>
              <div className="text-xs text-gray-500">Профиль</div>
            </div>
          </button>
          <button 
            className="flex justify-center items-center w-24 p-2 hover:bg-gray-200 rounded-lg"
            onClick={() => handleSignOut()}
          >
            <SignOut size={24}/>
          </button>
        </div>
      </div>

      {/* Основная часть */}
      <div className="flex-1 flex flex-col">
        
        {/* Заголовок */}
        <header className="bg-white border-b border-gray-200 h-15 p-4 flex justify-between items-center">
          <h2 className="text-lg font-medium">
            {activeTab === "My" ? "Мои доски" : 'Приглашения'}
          </h2>
          <div className="flex space-x-4">
            <button className="p-2 hover:bg-gray-100 rounded-full" onClick={() => setShowNewRoomModal(true)}>
              <Plus size={24}/>
            </button>
          </div>
        </header>

        {/* Карточки досок */}
        <main className="flex-1 bg-gray-50 p-6 overflow-auto">
          <div className="flex flex-wrap gap-8">
            {(activeTab === "My" ? boards : invitedBoards) ? (
              (activeTab === "My" ? boards : invitedBoards)!.map((board) => (
                <div 
                  key={board.ID} 
                  className="w-73 h-75 bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  <div className='flex justify-center h-40'>
                    <img 
                      // src="https://placehold.co/1280x720/png" 
                      src="../../thumbnail.png" 
                      alt={`Превью ${board.Name}`} 
                    />  
                  </div>
                  <div className="font-medium mb-2">{board.Name}</div>
                  <div className="text-sm text-gray-500 mb-4">
                    Создано: {formatDate(board.CreatedAt)}
                  </div>
                  
                  <div className='flex gap-2'>
                    <button className="w-full py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                      onClick={() => navigate(`/board/${board.ID}`)}
                    >
                      Открыть
                    </button>

                    {activeTab === "My" ?
                      <button className="flex items-center justify-center w-16 py-2 bg-red-600 text-white rounded-lg hover:bg-red-400 transition-colors"
                        onClick={() => handleDeleteBoard(board.ID)}
                      >
                        <TrashSimple size={28}/>
                      </button>
                      :
                      <button className="flex items-center justify-center w-16 py-2 bg-red-600 text-white rounded-lg hover:bg-red-400 transition-colors"
                        onClick={() => handleLeaveBoard(board.ID)}
                      >
                        <SignOut size={28}/>
                      </button>
                    }
                  </div>
                </div>
              ))
            ) : (
              <p>Нет досок или идёт загрузка...</p>
            )}
          </div>
        </main>

      </div>

      {showProfileModal && (
        <div className='fixed flex inset-0 bg-black/20 items-center justify-center z-50'>
          <div className='bg-white rounded-lg w-full max-w-md'>
            
            {/* Заголовок */}
            <div className="flex justify-between items-center mb-6 p-6">
              <h3 className="text-xl font-bold">Профиль</h3>
              <button 
                onClick={() => setShowProfileModal(false)}
                className="text-gray-500 hover:text-black"
              >
                ✕
              </button>
            </div>

            {/* Фото */}
            <div className="flex flex-col items-center p-6">
              <img 
                src="https://placehold.co/100x100/png" 
                alt="Профиль" 
                className="w-24 h-24 rounded-full mb-4"
              />
              <button className="text-sm text-black underline">Сменить фото</button>
            </div>
            
            {/* Информация */}
            <div className='space-y-4 pl-6 pr-6 pb-6'>
              <div>
                <label className="block text-sm font-medium mb-1">Имя</label>
                <input 
                  type="text" 
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Почта</label>
                <input 
                  type="email" 
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                />
              </div>

              {/* Кнопки */}
              <div className="mt-8 flex justify-end space-x-3">
                <button 
                  onClick={() => {
                    setShowProfileModal(false);
                    setUserEmail(user?.email!);
                    setUserName(user?.name!);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button 
                  onClick={() => setShowProfileModal(false)}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                >
                  Сохранить
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {showNewRoomModal && (
        <div className='fixed flex inset-0 bg-black/20 items-center justify-center z-50'>
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            
            {/* Заголовок */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Создать доску</h3>
              <button 
                onClick={() => setShowNewRoomModal(false)}
                className="text-gray-500 hover:text-black"
              >
                ✕
              </button>
            </div>

            {/* Имя доски */}
            <div className="mb-6">
              <label className="block text-sm font-medium mb-1">Название доски</label>
              <input 
                type="text" 
                placeholder="Например, Мозговой штурм"
                className="w-full p-2 border border-gray-300 rounded-lg"
                id="roomNameInput"
                value={newRoomName}
                onChange={e => setNewRoomName(e.target.value)}
              />
            </div>

            <div className="mt-8 flex justify-end space-x-3">
              <button 
                onClick={() => setShowNewRoomModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Отмена
              </button>
              <button 
                onClick={handleCreateRoom}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
              >
                Создать
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

export default DashBoard