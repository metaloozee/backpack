"use client";

import { useEffect } from "react";
import { usePrefsStore } from "@/lib/store/store";

export function StoreHydration() {
	useEffect(() => {
		usePrefsStore.persist.rehydrate();
	}, []);

	return null;
}
