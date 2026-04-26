import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { LoaderProvider } from "./context/LoaderContext";
import { injectLoader } from "./utils/api";
import { useEffect } from "react";
import { useLoader } from "./context/LoaderContext";

import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

import MainLayout from "./components/layout/MainLayout";
import GlobalLoader from "./components/common/GlobalLoader";

import Dashboard from "./components/Dashboard";
import ProjectsPage from "./modules/projects/ProjectsPage";
import ProjectDetailsPage from "./modules/projects/ProjectDetailsPage";
// ------------
import GoalsPage from "./modules/goals/GoalsPage";
import TasksPage from "./modules/tasks/TasksPage";
import TasksAllPage from "./modules/tasks/TasksAllPage";

function AppInner() {
  const { setLoading } = useLoader();

  useEffect(() => {
    injectLoader(setLoading);
  }, [setLoading]);

  return (
    <>
      <GlobalLoader />

      <Router>
        <Routes>

          {/* PRIVATE */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:id" element={<ProjectDetailsPage />} />
            <Route path="/goals" element={<GoalsPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/projects/:id/tasks/all" element={<TasksAllPage />} />
          </Route>

          {/* PUBLIC */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />

          <Route
            path="/register"
            element={
              <PublicRoute>
                <RegisterPage />
              </PublicRoute>
            }
          />

        </Routes>
      </Router>
    </>
  );
}

export default function App() {
  return (
    <LoaderProvider>
      <AuthProvider>
        <AppInner />
      </AuthProvider>
    </LoaderProvider>
  );
}

// import logo from './logo.svg';
// import './App.css';

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

// export default App;