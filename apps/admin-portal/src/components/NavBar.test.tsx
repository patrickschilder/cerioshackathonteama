import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { NavBar } from "./NavBar.js";

const logout = vi.fn();
let userRoles: string[] = [];

vi.mock("../hooks/useAuth.js", () => ({
	useAuth: (): { userRoles: string[]; logout: () => void } => ({ userRoles, logout }),
}));

function renderNavBar(): ReturnType<typeof render> {
	return render(
		<MemoryRouter>
			<NavBar />
		</MemoryRouter>,
	);
}

describe("NavBar (admin-portal)", () => {
	it("shows an 'A' avatar for an admin user", () => {
		userRoles = ["admin"];
		renderNavBar();

		expect(screen.getByText("A")).toBeInTheDocument();
	});

	it("shows an 'I' avatar for an instructor user", () => {
		userRoles = ["instructor"];
		renderNavBar();

		expect(screen.getByText("I")).toBeInTheDocument();
	});

	it("shows a '?' avatar when the user has neither role", () => {
		userRoles = [];
		renderNavBar();

		expect(screen.getByText("?")).toBeInTheDocument();
	});

	it("calls logout when the logout button is clicked", () => {
		userRoles = ["admin"];
		renderNavBar();

		fireEvent.click(screen.getByText("Uitloggen"));

		expect(logout).toHaveBeenCalledTimes(1);
	});
});
