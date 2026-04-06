/** Unmount delay after exit transition starts; keep in sync with Tailwind durations below. */
export const FULLSCREEN_TRANSITION_MS = 300;

const backdrop =
  "transition-opacity duration-300 ease-out motion-reduce:transition-none";

const panel =
  "transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:scale-100 motion-reduce:translate-y-0";

export function fullscreenBackdropClasses(active: boolean): string {
  return [backdrop, active ? "opacity-100" : "opacity-0"].join(" ");
}

export function fullscreenPanelClasses(active: boolean): string {
  return [
    panel,
    active
      ? "opacity-100 scale-100 translate-y-0"
      : "opacity-0 scale-[0.97] translate-y-2 sm:translate-y-3",
  ].join(" ");
}

/** Oracle shell: outer layer is only opacity; inner card adds motion without double-fading. */
const oracleShell =
  "transition-opacity duration-300 ease-out motion-reduce:transition-none";

const oracleCard =
  "transition-[transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none motion-reduce:scale-100 motion-reduce:translate-y-0";

export function oracleFullscreenShellClasses(active: boolean): string {
  return [oracleShell, active ? "opacity-100" : "opacity-0"].join(" ");
}

export function oracleFullscreenCardClasses(active: boolean): string {
  return [
    oracleCard,
    active
      ? "scale-100 translate-y-0"
      : "scale-[0.98] translate-y-3 sm:translate-y-2",
  ].join(" ");
}
