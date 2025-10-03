import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { createBrowserRouter, RouterProvider} from 'react-router-dom'
import Login from './pages/Login.tsx'
import Signup from './pages/Signup.tsx'
import Home from './pages/Home.tsx'
import NotFoundPage from './pages/NotFoundPage.tsx'
import YjsGate from './collaboration/YjsGate.tsx'
import DashBoard from './pages/DashBoard.tsx'

const router = createBrowserRouter([
  {path: "/board/:id", element: <YjsGate/>},
  {path: "/login", element: <Login/>},
  {path: "/signup", element: <Signup/>},
  {path: "/", element: <Home/>},
  {path: "*", element: <NotFoundPage/>},
  {path:"/dashboard", element:<DashBoard/>}
]);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router}/>
  </StrictMode>,
)
