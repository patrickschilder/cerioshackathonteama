import React, { createContext, useContext, useEffect, useRef, useState } from "react";

import keycloak from "../keycloak.js";

interface AuthContextValue {
	ready: boolean;
	authenticated: boolean;
	token: string | undefined;
	userRoles: string[];
	login: () => void;
	logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactElement {
	const [ready, setReady] = useState(false);
	const [authenticated, setAuthenticated] = useState(false);
	const initStarted = useRef(false);

	useEffect(() => {
		if (initStarted.current) return;
		initStarted.current = true;

		keycloak
			.init({ onLoad: "login-required", checkLoginIframe: false })
			.then(auth => {
				setAuthenticated(auth);
				setReady(true);
			})
			.catch(() => {
				setReady(true);
			});
	}, []);

	const value: AuthContextValue = {
		ready,
		authenticated,
		token: keycloak.token,
		userRoles: keycloak.realmAccess?.roles ?? [],
		login: () => {
			keycloak.login().catch(() => {});
		},
		logout: () => {
			keycloak.logout({ redirectUri: window.location.origin }).catch(() => {});
		},
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within AuthProvider");
	return ctx;
}
