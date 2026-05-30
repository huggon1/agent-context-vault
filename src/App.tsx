import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LibraryProvider } from "./context/LibraryContext";
import { ProjectsProvider } from "./context/ProjectsContext";
import { AppShell } from "./components/AppShell";
import { ProjectsPage } from "./pages/ProjectsPage";
import { ProjectDetailPage } from "./pages/ProjectDetailPage";
import { SkillsPage } from "./pages/SkillsPage";
import { PromptsPage } from "./pages/PromptsPage";

export default function App() {
  return (
    <LibraryProvider>
      <ProjectsProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<Navigate to="/projects" replace />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:id" element={<ProjectDetailPage />} />
              <Route path="/skills" element={<SkillsPage />} />
              <Route path="/prompts" element={<PromptsPage />} />
              <Route path="*" element={<Navigate to="/projects" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ProjectsProvider>
    </LibraryProvider>
  );
}
