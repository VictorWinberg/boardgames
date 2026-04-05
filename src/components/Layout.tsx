import { NavLink, Outlet } from "react-router-dom";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "rounded-md px-3 py-2 text-base font-semibold tracking-wide transition-colors",
    isActive
      ? "bg-primary text-primary-foreground shadow-md ring-1 ring-primary/30"
      : "text-muted-foreground hover:bg-muted/80 hover:text-foreground",
  ].join(" ");

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="app-header-bar border-b border-border/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="app-title text-lg font-bold text-foreground sm:text-xl">
              The collection
            </p>
            <p className="text-base text-muted-foreground">
              Tavern hearth · BoardGameGeek shelf
            </p>
          </div>
          <nav className="flex gap-1 rounded-lg border border-border/50 bg-background/25 p-1">
            <NavLink to="/" end className={linkClass}>
              Shelf
            </NavLink>
            <NavLink to="/random" className={linkClass}>
              Oracle
            </NavLink>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
