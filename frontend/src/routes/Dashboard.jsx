import { NavLink, Outlet, useNavigate } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext.jsx";

/* =========================================================
   NAVIGATION CONFIGURATION

   Add future dashboard features here.

   Example:

   {
     title: "Reports",
     items: [
       {
         label: "Sales Report",
         path: "/dashboard/sales-report",
         icon: "report",
       },
     ],
   }

   No sidebar JSX changes are required.
========================================================= */

const navigationSections = [
  {
    title: "Management",
    items: [
      {
        label: "Buyers",
        path: "/dashboard/buyers",
        icon: "buyers",
      },
      {
        label: "Items",
        path: "/dashboard/items",
        icon: "items",
      },
      {
        label: "Sellers",
        path: "/dashboard/sellers",
        icon: "sellers",
      },
    ],
  },

  {
    title: "Transactions",
    items: [
      {
        label: "Purchase",
        path: "/dashboard/purchase",
        icon: "purchase",
      },
      {
        label: "Selling",
        path: "/dashboard/selling",
        icon: "selling",
      },
    ],
  },

  {
    title: "History",
    items: [
      {
        label: "Purchase History",
        path: "/dashboard/purchase-history",
        icon: "history",
      },
      {
        label: "Selling History",
        path: "/dashboard/selling-history",
        icon: "history",
      },
    ],
  },

  {
    title: "Business",
    items: [
      {
        label: "Stock",
        path: "/dashboard/stock",
        icon: "stock",
      },
      {
        label: "Expenditure",
        path: "/dashboard/expenditure",
        icon: "rupee",
      },
      {
        label: "Khatabook",
        path: "/dashboard/khatabook",
        icon: "ledger",
      },
      {
        label: "Money Due",
        path: "/dashboard/money-due",
        icon: "money-due",
      },
    ],
  },
];

/* =========================================================
   SIDEBAR ICONS

   Inline SVGs keep the dashboard dependency free.
========================================================= */

function DashboardIcon({ type }) {
  const commonProps = {
    width: 17,
    height: 17,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  switch (type) {
    case "buyers":
      return (
        <svg {...commonProps}>
          <rect x="5" y="5" width="14" height="14" rx="1.5" />
          <path d="M9 9h6M9 13h6M9 17h3" />
        </svg>
      );

    case "items":
      return (
        <svg {...commonProps}>
          <rect x="5" y="5" width="14" height="14" rx="1.5" />
        </svg>
      );

    case "sellers":
      return (
        <svg {...commonProps}>
          <path d="M6 6h12M6 10h12M6 14h12M6 18h12" />
        </svg>
      );

    case "purchase":
      return (
        <svg {...commonProps}>
          <path d="M12 4v16" />
          <path d="m7 15 5 5 5-5" />
        </svg>
      );

    case "selling":
      return (
        <svg {...commonProps}>
          <path d="M12 20V4" />
          <path d="m7 9 5-5 5 5" />
        </svg>
      );

    case "history":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="7" />
          <path d="M12 8v4l3 2" />
        </svg>
      );

    case "stock":
      return (
        <svg {...commonProps}>
          <path d="M5 6h14v12H5z" />
          <path d="M8 6v12M11 6v12M14 6v12M17 6v12" />
          <path d="M5 10h14M5 14h14" />
        </svg>
      );

    case "rupee":
      return (
        <svg {...commonProps}>
          <path d="M7 6h10M7 10h8" />
          <path d="m8 10 8 8" />
          <path d="M8 6c5 0 7 2 7 5s-2 5-7 5" />
        </svg>
      );

    case "ledger":
      return (
        <svg {...commonProps}>
          <rect x="5" y="5" width="14" height="14" rx="1.5" />
          <path d="M8 9h8M8 12h8M8 15h8" />
        </svg>
      );

    case "money-due":
      return (
        <svg {...commonProps}>
          <path d="M6 8h12v10H6z" />
          <path d="M8 8V6h8v2" />
          <path d="M10 12h4M12 10v4" />
        </svg>
      );

    case "profile":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="10" r="2.5" />
          <path d="M8.5 17c.9-2 2.1-3 3.5-3s2.6 1 3.5 3" />
        </svg>
      );

    case "logout":
      return (
        <svg {...commonProps}>
          <path d="M10 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h4" />
          <path d="m13 8 4 4-4 4M9 12h8" />
        </svg>
      );

    default:
      return null;
  }
}

/* =========================================================
   SIDEBAR ITEM

   Keeping this separate makes the navigation easier to
   maintain as the application grows.
========================================================= */

function SidebarNavItem({ item }) {
  return (
    <NavLink
      to={item.path}
      className={({ isActive }) =>
        [
          "group flex h-[38px] items-center gap-3 rounded-md px-3",
          "text-[14px] font-medium transition-colors duration-150",
          "outline-none focus-visible:ring-2 focus-visible:ring-slate-500/60",

          isActive
            ? "bg-slate-800 text-slate-100 shadow-sm"
            : "text-slate-400 hover:bg-slate-900/80 hover:text-slate-200",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={[
              "flex w-5 shrink-0 items-center justify-center",
              "transition-colors",
              isActive
                ? "text-slate-200"
                : "text-slate-500 group-hover:text-slate-300",
            ].join(" ")}
          >
            <DashboardIcon type={item.icon} />
          </span>

          <span className="truncate">{item.label}</span>
        </>
      )}
    </NavLink>
  );
}

/* =========================================================
   FIXED SIDEBAR
========================================================= */

function DashboardSidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();

    navigate("/login", {
      replace: true,
    });
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-[240px] flex-col border-r border-slate-800/90 bg-[#090e15] text-slate-300">
      {/* =====================================================
          BRAND
      ===================================================== */}

      <div className="flex h-[68px] shrink-0 items-center border-b border-slate-800/90 px-5">
        <NavLink
          to="/dashboard"
          end
          aria-label="Go to dashboard"
          className="text-[24px] font-bold tracking-[-0.03em] text-white transition-opacity hover:opacity-85"
        >
          XYZ
        </NavLink>
      </div>

      {/* =====================================================
          MAIN NAVIGATION
      ===================================================== */}

      <nav
        aria-label="Dashboard navigation"
        className="min-h-0 flex-1 overflow-y-auto px-3 py-4"
      >
        <div className="space-y-5">
          {navigationSections.map((section) => (
            <section key={section.title}>
              {/* Section title */}

              <h2 className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                {section.title}
              </h2>

              {/* Section items */}

              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <SidebarNavItem key={item.path} item={item} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </nav>

      {/* =====================================================
          ACCOUNT ACTIONS

          These stay at the bottom regardless of the amount
          of navigation added above.
      ===================================================== */}

      <div className="shrink-0 border-t border-slate-800/90 bg-[#090e15] px-3 py-3">
        <NavLink
          to="/dashboard/profile"
          className={({ isActive }) =>
            [
              "group flex h-[38px] items-center gap-3 rounded-md px-3",
              "text-[14px] font-medium transition-colors duration-150",
              "outline-none focus-visible:ring-2 focus-visible:ring-slate-500/60",

              isActive
                ? "bg-slate-800 text-slate-100 shadow-sm"
                : "text-slate-400 hover:bg-slate-900/80 hover:text-slate-200",
            ].join(" ")
          }
        >
          {({ isActive }) => (
            <>
              <span
                className={[
                  "flex w-5 shrink-0 items-center justify-center",
                  isActive
                    ? "text-slate-200"
                    : "text-slate-500 group-hover:text-slate-300",
                ].join(" ")}
              >
                <DashboardIcon type="profile" />
              </span>

              <span>Profile</span>
            </>
          )}
        </NavLink>

        <button
          type="button"
          onClick={handleLogout}
          className="group mt-0.5 flex h-[38px] w-full items-center gap-3 rounded-md px-3 text-left text-[14px] font-medium text-slate-400 transition-colors duration-150 hover:bg-slate-900/80 hover:text-slate-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500/60"
        >
          <span className="flex w-5 shrink-0 items-center justify-center text-slate-500 group-hover:text-slate-300">
            <DashboardIcon type="logout" />
          </span>

          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

/* =========================================================
   DASHBOARD OVERVIEW

   This is the content rendered at:

   /dashboard

   It is NOT a separate Home route.
========================================================= */

export function DashboardOverview() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-5 lg:p-6">
      <div className="mx-auto w-full max-w-[1600px]">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
            Dashboard
          </p>

          <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
            Welcome back
          </h1>

          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-500">
            Select a section from the sidebar to manage your business. The
            sidebar stays fixed while the selected section opens here.
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   DASHBOARD SHELL
========================================================= */

function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-50">
      <DashboardSidebar />

      <main className="ml-[240px] min-h-screen min-w-0 bg-slate-50">
        <Outlet />
      </main>
    </div>
  );
}

export default Dashboard;
