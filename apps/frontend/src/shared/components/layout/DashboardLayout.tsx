import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../features/authentication/context/AuthContext';
import { useAnnouncementUnreadCount } from '../../../features/announcements/api/announcements';
import { can } from '../../permissions/can';
import { BrandLogo, UserAvatar } from '../ui';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  ClipboardList, 
  CalendarCheck,
  Megaphone, 
  Settings, 
  User, 
  LogOut, 
  Menu, 
  X,
  BookOpen
} from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: announcementUnreadCount } = useAnnouncementUnreadCount(!!user);

  if (!user) return null;

  const menuItems = [
    {
      name: 'Overview',
      path: '/dashboard',
      icon: LayoutDashboard,
      roles: ['super_admin', 'admin', 'teacher', 'student'],
    },
    {
      name: 'Programs',
      path: '/dashboard/programs',
      icon: BookOpen,
      roles: ['super_admin', 'admin', 'teacher', 'student'],
    },
    {
      name: 'Cohorts',
      path: '/dashboard/cohorts',
      icon: Users,
      roles: ['super_admin', 'admin', 'teacher'], // students see cohort inside program detail
    },
    {
      name: 'Applications',
      path: '/dashboard/applications',
      icon: FileText,
      roles: ['super_admin', 'admin'],
    },
    {
      name: 'Assignments',
      path: '/dashboard/assignments',
      icon: ClipboardList,
      roles: ['super_admin', 'admin', 'teacher', 'student'],
    },
    {
      name: 'Attendance',
      path: '/dashboard/attendance',
      icon: CalendarCheck,
      roles: ['super_admin', 'admin', 'teacher'],
    },
    {
      name: 'Modules',
      path: '/dashboard/modules',
      icon: BookOpen,
      roles: ['super_admin', 'admin', 'teacher', 'student'],
    },
    {
      name: 'Announcements',
      path: '/dashboard/announcements',
      icon: Megaphone,
      roles: ['super_admin', 'admin', 'teacher', 'student'],
    },
    {
      name: 'Settings',
      path: '/dashboard/settings',
      icon: Settings,
      roles: ['super_admin'], // Only Super Admins can manage platform settings
    },
    {
      name: 'My Profile',
      path: '/dashboard/profile',
      icon: User,
      roles: ['super_admin', 'admin', 'teacher', 'student'],
    },
  ];

  const visibleMenuItems = menuItems.filter(item => item.roles.includes(user.role));
  const unreadAnnouncements = announcementUnreadCount?.count ?? 0;
  const isWideWorkspace = location.pathname.startsWith('/dashboard/modules') || location.pathname.startsWith('/dashboard/programs');
  const compactSidebarRevealClass = isWideWorkspace
    ? 'w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 group-hover/sidebar:w-auto group-hover/sidebar:opacity-100 group-focus-within/sidebar:w-auto group-focus-within/sidebar:opacity-100'
    : 'flex-1';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const roleLabels: Record<string, { label: string; bg: string }> = {
    super_admin: { label: 'Super Admin', bg: 'bg-red-50 text-red-700 border-red-200' },
    admin: { label: 'Admin', bg: 'bg-slate-100 text-slate-800 border-slate-300' },
    teacher: { label: 'Teacher', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
    student: { label: 'Student', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  };

  const currentRole = roleLabels[user.role] || { label: 'User', bg: 'bg-slate-50 text-slate-700 border-slate-200' };

  return (
    <div className="min-h-screen skx-grid-bg flex text-[#141414]" id="dashboard-layout-root">
      {/* Sidebar for Desktop */}
      <aside
        className={`group/sidebar hidden md:flex flex-col bg-white/95 border-r border-[#d8d8d4] shrink-0 sticky top-0 h-screen transition-[width] duration-200 ${
          isWideWorkspace ? 'w-20 hover:w-64 focus-within:w-64' : 'w-64'
        }`}
        id="desktop-sidebar"
      >
        {/* Branding Header */}
        <div
          className={`border-b border-[#d8d8d4] flex flex-col gap-1 transition-all duration-200 ${
            isWideWorkspace ? 'p-3 group-hover/sidebar:p-6 group-focus-within/sidebar:p-6' : 'p-6'
          }`}
        >
          <div className={`flex items-center gap-2 ${isWideWorkspace ? 'justify-center group-hover/sidebar:justify-start group-focus-within/sidebar:justify-start' : ''}`}>
            {isWideWorkspace && (
              <BrandLogo
                variant="icon"
                className="h-10 w-10 group-hover/sidebar:hidden group-focus-within/sidebar:hidden"
              />
            )}
            <BrandLogo
              variant="full"
              className={`h-16 w-48 ${isWideWorkspace ? 'hidden group-hover/sidebar:block group-focus-within/sidebar:block' : ''}`}
            />
          </div>
        </div>

        {/* User Quick Info */}
        <div
          className={`p-4 border-b border-[#d8d8d4] flex items-center gap-3 bg-[#fbfbfa] ${
            isWideWorkspace ? 'justify-center group-hover/sidebar:justify-start group-focus-within/sidebar:justify-start' : ''
          }`}
        >
          <UserAvatar
            firstName={user.first_name}
            lastName={user.last_name}
            src={user.avatar_url}
            className="h-10 w-10 shadow-xs"
          />
          <div className={`min-w-0 ${compactSidebarRevealClass}`}>
            <h4 className="font-semibold text-sm text-[#141414] truncate">
              {user.first_name} {user.last_name}
            </h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${currentRole.bg}`}>
                {currentRole.label}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`relative flex items-center gap-3 border px-3 py-2 text-sm font-semibold transition-colors ${
                  isActive 
                    ? 'border-[#141414] bg-[#f3f3f0] text-[#141414]' 
                    : 'border-transparent text-[#5f5f5a] hover:border-[#d8d8d4] hover:bg-[#fbfbfa] hover:text-[#141414]'
                } ${isWideWorkspace ? 'justify-center group-hover/sidebar:justify-start group-focus-within/sidebar:justify-start' : ''}`}
                id={`sidebar-item-${item.name.toLowerCase()}`}
                title={isWideWorkspace ? item.name : undefined}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#141414]' : 'text-[#9a9a94]'}`} />
                <span className={compactSidebarRevealClass}>{item.name}</span>
                {item.name === 'Announcements' && unreadAnnouncements > 0 && (
                  <span
                    className={`min-w-5 rounded-full bg-red-600 px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-white ${
                      isWideWorkspace
                        ? 'absolute right-2 top-1 min-w-4 px-1 text-[9px] group-hover/sidebar:static group-hover/sidebar:min-w-5 group-hover/sidebar:px-1.5 group-hover/sidebar:text-[10px] group-focus-within/sidebar:static group-focus-within/sidebar:min-w-5 group-focus-within/sidebar:px-1.5 group-focus-within/sidebar:text-[10px]'
                        : ''
                    }`}
                  >
                    {unreadAnnouncements > 99 ? '99+' : unreadAnnouncements}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer Logout */}
        <div className="p-4 border-t border-[#d8d8d4]">
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 border border-transparent px-3 py-2.5 text-sm font-semibold text-[#5f5f5a] hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 transition-colors text-left ${
              isWideWorkspace ? 'justify-center group-hover/sidebar:justify-start group-focus-within/sidebar:justify-start' : ''
            }`}
            id="sidebar-logout-btn"
            title={isWideWorkspace ? 'Logout' : undefined}
          >
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-rose-600" />
            <span className={compactSidebarRevealClass}>Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile Drawer Slide-out overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="w-64 max-w-[80vw] bg-white h-full flex flex-col border-r border-[#d8d8d4]" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-16 flex items-center justify-between px-6 border-b border-[#d8d8d4]">
              <div className="flex items-center gap-2.5">
                <BrandLogo variant="full" className="h-14 w-44" />
              </div>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-[#5f5f5a] hover:bg-[#f3f3f0]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-[#d8d8d4] flex items-center gap-3 bg-[#fbfbfa]">
              <UserAvatar
                firstName={user.first_name}
                lastName={user.last_name}
                src={user.avatar_url}
                className="h-10 w-10"
              />
              <div>
                <h4 className="font-semibold text-sm text-slate-800">{user.first_name} {user.last_name}</h4>
                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${currentRole.bg}`}>
                  {currentRole.label}
                </span>
              </div>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {visibleMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 border px-3 py-2 text-sm font-semibold ${
                      isActive 
                        ? 'border-[#141414] bg-[#f3f3f0] text-[#141414]' 
                        : 'border-transparent text-[#5f5f5a] hover:border-[#d8d8d4] hover:bg-[#fbfbfa]'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="flex-1">{item.name}</span>
                    {item.name === 'Announcements' && unreadAnnouncements > 0 && (
                      <span className="min-w-5 rounded-full bg-red-600 px-1.5 py-0.5 text-center text-[10px] font-bold leading-none text-white">
                        {unreadAnnouncements > 99 ? '99+' : unreadAnnouncements}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="p-4 border-t border-[#d8d8d4]">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 border border-transparent px-3 py-2 text-sm font-medium text-[#5f5f5a] hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content viewport */}
      <div className="flex-1 flex flex-col min-w-0" id="main-content-viewport">
        {/* Top Navbar */}
        <header className="h-16 bg-white/95 border-b border-[#d8d8d4] flex items-center justify-between px-6 md:px-8 sticky top-0 z-30" id="top-navbar">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 -ml-2 text-[#5f5f5a] hover:bg-[#f3f3f0]"
            id="mobile-menu-trigger"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Context title / Breadcrumbs placeholder */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-[#9a9a94]">
            <span className="hover:text-[#141414] cursor-pointer">Workspace</span>
            <span className="text-[#d8d8d4]">/</span>
            <span className="text-[#141414] font-semibold">
              {location.pathname.split('/').slice(2).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' / ') || 'Overview'}
            </span>
          </div>

          {/* Quick Stats / Right Side Info */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
              <span className="text-xs text-[#5f5f5a] font-mono font-medium">July 02, 2026</span>
            </div>
            <div className="h-8 w-[1px] bg-[#d8d8d4] hidden md:block"></div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-[#141414]">{user.first_name} {user.last_name}</span>
              <UserAvatar
                firstName={user.first_name}
                lastName={user.last_name}
                src={user.avatar_url}
                className="h-8 w-8 text-xs"
              />
            </div>
          </div>
        </header>

        {/* Dynamic page container */}
        <main
          className={`flex-1 overflow-y-auto p-5 md:p-8 ${isWideWorkspace ? 'w-full' : 'mx-auto w-full max-w-7xl'}`}
          id="page-content-wrapper"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
