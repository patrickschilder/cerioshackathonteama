import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { NavBar } from "./NavBar.js";

const logout = vi.fn();
let userName = "Student";

vi.mock("../hooks/useAuth.js", () => ({
	useAuth: (): { userName: string; logout: () => void } => ({ userName, logout }),
}));

function renderNavBar(): ReturnType<typeof render> {
	return render(
		<MemoryRouter>
			<NavBar />
		</MemoryRouter>
	);
}

describe("NavBar (student-portal)", () => {
	it("shows the user's initials in the avatar", () => {
		userName = "Jane Doe";
		renderNavBar();

		expect(screen.getByText("JD")).toBeInTheDocument();
	});

	it("shows the full user name next to the avatar", () => {
		userName = "Jane Doe";
		renderNavBar();

		expect(screen.getByText("Jane Doe")).toBeInTheDocument();
	});

	it("falls back to 'S' when the user name is empty", () => {
		userName = "";
		renderNavBar();

		expect(screen.getByText("S")).toBeInTheDocument();
	});

	it("calls logout when the logout button is clicked", () => {
		userName = "Jane Doe";
		renderNavBar();

		fireEvent.click(screen.getByText("Uitloggen"));

		expect(logout).toHaveBeenCalledTimes(1);
	});
});
