"use client";

import {
	createContext,
	type Dispatch,
	type ReactNode,
	type SetStateAction,
	useContext,
	useEffect,
	useState,
} from "react";

interface MobileHeaderState {
	title: string | null;
	subtitle: string | null;
}

const MobileHeaderContext = createContext<{
	state: MobileHeaderState;
	setState: Dispatch<SetStateAction<MobileHeaderState>>;
}>({
	state: { title: null, subtitle: null },
	setState: () => {
		// default no-op
	},
});

export function MobileHeaderProvider({ children }: { children: ReactNode }) {
	const [state, setState] = useState<MobileHeaderState>({
		title: null,
		subtitle: null,
	});

	return (
		<MobileHeaderContext.Provider value={{ state, setState }}>
			{children}
		</MobileHeaderContext.Provider>
	);
}

export function useMobileHeader() {
	return useContext(MobileHeaderContext).state;
}

export function useSetMobileHeader(
	title: string | null,
	subtitle: string | null
) {
	const { setState } = useContext(MobileHeaderContext);

	useEffect(() => {
		setState({ title, subtitle });
	}, [title, subtitle, setState]);

	useEffect(() => {
		return () => {
			setState({ title: null, subtitle: null });
		};
	}, [setState]);
}
