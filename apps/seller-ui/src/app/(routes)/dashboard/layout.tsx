//  if url starts with /dashboard we will add one sidebar
//  for seller once logged in we will redirect to dashboard
import SideBarWrapper from "apps/seller-ui/src/shared/components/sidebar/sidebar";
import React from "react";
const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="flex h-full bg-black min-h-screen">
      {/* sidebar  */}
      <aside className="w-[280px] min-w-[250px] max-w-[300px] border-r  border-r-slate-800 text-white p-4">
        <div className="sticky top-0">
          <SideBarWrapper />
        </div>
      </aside>
      {/* main content area  */}
      <main className="flex-1">
        <div className="overflow-auto">{children}</div>
      </main>
    </div>
  );
};

export default Layout;

// Each folder inside (routes) corresponds to a route.
// src/app/(routes)/dashboard/page.tsx   → /dashboard
// src/app/(routes)/auth/login/page.tsx  → /auth/login
// A page.tsx defines the UI for that route.
// It’s like your entry point for a route.
// A layout.tsx defines the shared layout for that folder’s route segment.
// All pages inside that folder will use this layout unless overridden by a deeper layout.tsx.
// src/app/(routes)/dashboard/layout.tsx
// src/app/(routes)/dashboard/page.tsx
// The layout.tsx will wrap around the dashboard’s page.tsx
// hen you open /dashboard, you’ll see both the sidebar + page content.
// Why mix page.tsx and layout.tsx?
// Some routes only need a page (like /about → just page.tsx).
// Some routes need a layout (like /dashboard → sidebar + navbar shared across dashboard pages).
// If a folder has both, the layout wraps the page.
