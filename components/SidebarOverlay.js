'use client';

export default function SidebarOverlay() {
  return (
    <div
      className="sidebar-overlay"
      id="sidebar-overlay"
      onClick={() => document.documentElement.classList.remove('sidebar-open')}
    ></div>
  );
}
