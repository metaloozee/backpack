"use client";

import { useSyncExternalStore } from "react";
import { usePrefsStore } from "./store";

const subscribe = (onStoreChange: () => void) => {
	const unsubscribeHydrate = usePrefsStore.persist.onHydrate(onStoreChange);
	const unsubscribeFinish =
		usePrefsStore.persist.onFinishHydration(onStoreChange);

	return () => {
		unsubscribeHydrate();
		unsubscribeFinish();
	};
};

const getSnapshot = () => usePrefsStore.persist.hasHydrated();

export const usePrefsHydrated = () =>
	useSyncExternalStore(subscribe, getSnapshot, () => false);
