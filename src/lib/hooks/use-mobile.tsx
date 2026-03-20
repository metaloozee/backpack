import { useSyncExternalStore } from "react";

const MOBILE_BREAKPOINT = 768;

const query = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`;

const subscribe = (callback: () => void) => {
	const mql = window.matchMedia(query);
	mql.addEventListener("change", callback);
	return () => mql.removeEventListener("change", callback);
};

const getSnapshot = () => window.innerWidth < MOBILE_BREAKPOINT;

const getServerSnapshot = () => false;

/** True when viewport width is under 768px. Matches Tailwind `md` and e.g. `md:hidden` on the mobile header. */
export function useIsMobile() {
	return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
