import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import ChatPage from "./pages/ChatPage";
import StyleGuide from "./components/style-guide";
import ProtectedRoute from "./components/ProtectedRoute";

export const routerConfig = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { 
        path: "/", 
        element: (
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        ) 
      },
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> },
      { path: "/gostyle", element: <StyleGuide /> },
    ],
  },
]);