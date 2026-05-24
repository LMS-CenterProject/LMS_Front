import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CoursesProvider } from "./context/CoursesContext";
import AppRouter from "./routes";
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CoursesProvider>
          <AppRouter />
        </CoursesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
