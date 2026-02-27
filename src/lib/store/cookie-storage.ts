import Cookies from "js-cookie";
import type { StateStorage } from "zustand/middleware";

const COOKIE_OPTIONS: Cookies.CookieAttributes = {
	expires: 28,
	secure: process.env.NODE_ENV === "production",
	sameSite: "lax",
};

export const cookieStorage: StateStorage = {
	getItem: (key) => {
		return Cookies.get(key) ?? null;
	},
	setItem: (key, value) => {
		Cookies.set(key, value, COOKIE_OPTIONS);
	},
	removeItem: (key) => {
		Cookies.remove(key);
	},
};
