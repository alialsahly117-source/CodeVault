import { Routes, Route } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "./layouts/MainLayout";
import { ProtectedRoute } from "./features/auth/ProtectedRoute";
import { settingsService } from "./services/settings.service";
import { useAuth } from "./features/auth/AuthContext";

import { HomePage } from "./pages/HomePage";
import { ExplorePage } from "./pages/ExplorePage";
import { ProjectsPage } from "./pages/ProjectsPage";
import { ProjectDetailPage } from "./pages/ProjectDetailPage";
import { CodesPage } from "./pages/CodesPage";
import { PromptsPage } from "./pages/PromptsPage";
import { CodeDetailPage } from "./pages/CodeDetailPage";
import { PromptDetailPage } from "./pages/PromptDetailPage";
import { NewCodePage } from "./pages/NewCodePage";
import { NewPromptPage } from "./pages/NewPromptPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/ResetPasswordPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ContactPage } from "./pages/ContactPage";
import { NotFoundPage } from "./pages/NotFoundPage";

function MaintenanceNotice() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4 text-center">
      <div className="font-mono text-lg font-bold text-accent">CodeVault</div>
      <h1 className="mt-4 text-xl font-bold text-text">الموقع تحت الصيانة حاليًا</h1>
      <p className="mt-2 max-w-sm text-sm text-text-secondary">
        نعمل على تحسين المنصة. الرجاء المحاولة مرة أخرى بعد قليل.
      </p>
    </div>
  );
}

export default function App() {
  const { isStaff } = useAuth();
  const { data: settings } = useQuery({
    queryKey: ["public-settings"],
    queryFn: settingsService.get,
    staleTime: 60_000,
  });

  // Staff can still browse the public site during maintenance (e.g. to verify a fix).
  if (settings?.maintenanceMode && !isStaff) {
    return <MaintenanceNotice />;
  }

  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/:slug" element={<ProjectDetailPage />} />
        <Route path="/codes" element={<CodesPage />} />
        <Route path="/codes/:id" element={<CodeDetailPage />} />
        <Route path="/prompts" element={<PromptsPage />} />
        <Route path="/prompts/:id" element={<PromptDetailPage />} />
        <Route path="/contact" element={<ContactPage />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/codes/new" element={<NewCodePage />} />
          <Route path="/codes/:id/edit" element={<NewCodePage />} />
          <Route path="/prompts/new" element={<NewPromptPage />} />
          <Route path="/prompts/:id/edit" element={<NewPromptPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
