// import { BrowserRouter } from 'react-router-dom'; // Correct import for BrowserRouter
import { useRoutes, useNavigate } from "react-router-dom";
import { useEffect, useRef } from 'react';
import AuthRoutes from "./routes/AuthRoutes";
import MainRoutes from "./routes/MainRoutes";
import { Toaster } from 'react-hot-toast';
import ChatBot from './components/ChatBot'; // Correct component name (case-sensitive)
import { useAuth } from './AuthContext';


// export const BaseUrl = 'http://localhost:8404/soppotool/';

export const BaseUrl ='https://marketingpotool.cavinkare.in/soppotool/';


// export const BaseUrl = 'https://uat.cavinkare.in/soppotool/'; 
// export const BaseUrl = 'https://qa.cavinkare.in/soppotool/';

//sapURL
export const SapURL = "http://13.126.161.240:8002/sap/bc/zfmbdt?sap-client=500";

// qa link

// export const loginUrl = 'https://uat.cavinkare.in/authorization/v1/auth/login';
// export const loginUrl = 'http://localhost:8303/auth-server/v1/auth/login';
 export const loginUrl = 'https://magicportal.cavinkare.in/authorization/v1/auth/login';

const TIMEOUT_MS = 60 * 60 * 1000; 

export default function ThemeRoutes() {
  const routes = useRoutes([AuthRoutes, MainRoutes]);
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const hiddenAt = useRef(null);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        hiddenAt.current = Date.now();
      } else if (hiddenAt.current && isAuthenticated) {
        if (Date.now() - hiddenAt.current >= TIMEOUT_MS) {
          logout();
          navigate('/login');
        }
        hiddenAt.current = null;
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated, logout, navigate]);

  return (
    <useRoutes>
      <div>
        {/* <ChatBot />  */}
        {/* Render the ChatBot component */}
        {routes} {/* Render all application routes */}
        <Toaster
          toastOptions={{
            style: {
              fontSize: '16px',
              padding: '16px',
              maxWidth: '500px'
            }
          }}
        /> {/* Render toast notifications */}
      </div>
    </useRoutes>
  );
}
