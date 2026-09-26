import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import Landing from "./pages/Landing.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import GoogleCallback from "./pages/GoogleCallback.jsx";
import HomePage from "./pages/HomePage.jsx";
import SearchPage from "./pages/SearchPage.jsx";
import CreatePage from "./pages/CreatePage.jsx";
import DiscussPage from "./pages/DiscussPage.jsx";
import GroupsPage from "./pages/GroupsPage.jsx";
import { TempChatPage, FinalChatPage } from "./pages/ChatPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import PlatformPage from "./pages/PlatformPage.jsx";
import { NotificationsPage } from "./pages/StubPages.jsx";
import SavedPage from "./pages/SavedPage.jsx";
import {
  AppliedListPage,
  MyRequestsListPage,
} from "./pages/MyListsPages.jsx";

import ReportBug from "./components/ReportBug.jsx";
import BackButton from "./components/BackButton.jsx";

// Admin
import AdminLogin from "./pages/admin/AdminLogin.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminReports from "./pages/admin/AdminReports.jsx";
import AdminBugs from "./pages/admin/AdminBugs.jsx";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />

      <Routes>
        {/* Public/User routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />
        <Route path="/google-callback" element={<GoogleCallback />} />

        <Route path="/home" element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/discuss" element={<DiscussPage />} />

        <Route path="/chat/:groupid" element={<TempChatPage />} />
        <Route path="/groupchat/:groupid" element={<FinalChatPage />} />

        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/saved" element={<SavedPage />} />

        <Route path="/applied" element={<AppliedListPage />} />
        <Route path="/my-requests" element={<MyRequestsListPage />} />

        <Route path="/profile/:userid" element={<ProfilePage />} />
        <Route path="/platform/:platformid" element={<PlatformPage />} />

        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/bugs" element={<AdminBugs />} />

        {/* Fallback */}
        <Route path="*" element={<Landing />} />
      </Routes>

      <ReportBug />
      <BackButton />
    </>
  );
}