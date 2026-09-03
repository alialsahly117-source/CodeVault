import { Routes, Route } from "react-router-dom";
import { AdminLayout } from "./layouts/AdminLayout";
import { RequireStaff, RequireAdmin, RequireModerator } from "./features/auth/RouteGuards";

import { LoginPage } from "./pages/LoginPage";
import { AccessDeniedPage } from "./pages/AccessDeniedPage";
import { DashboardPage } from "./pages/DashboardPage";
import { UsersPage } from "./pages/UsersPage";
import { CodesPage } from "./pages/CodesPage";
import { PromptsPage } from "./pages/PromptsPage";
import { NewCodePage } from "./pages/NewCodePage";
import { NewPromptPage } from "./pages/NewPromptPage";
import { CategoriesPage } from "./pages/CategoriesPage";
import { TagsPage } from "./pages/TagsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { SettingsPage } from "./pages/SettingsPage";
import { LogsPage } from "./pages/LogsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/access-denied" element={<AccessDeniedPage />} />

      <Route element={<RequireStaff />}>
        <Route element={<AdminLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="codes" element={<CodesPage />} />
          <Route path="codes/new" element={<NewCodePage />} />
          <Route path="prompts" element={<PromptsPage />} />
          <Route path="prompts/new" element={<NewPromptPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="tags" element={<TagsPage />} />

          <Route element={<RequireModerator />}>
            <Route path="reports" element={<ReportsPage />} />
          </Route>

          <Route element={<RequireAdmin />}>
            <Route path="users" element={<UsersPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="logs" element={<LogsPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
