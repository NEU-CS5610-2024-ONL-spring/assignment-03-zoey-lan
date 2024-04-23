import Home from "../components/Home";
//import { useNavigate } from "react-router-dom";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { BrowserRouter } from "react-router-dom";

// Mock useAuth0 hook
jest.mock("@auth0/auth0-react");

describe("Home Component", () => {
  it("renders Home component", () => {
    // Mock isAuthenticated as false initially
    useAuth0.mockReturnValue({
      isAuthenticated: false,
      loginWithRedirect: jest.fn(),
    });

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
    waitFor(() => {
      expect(
        screen.getByText(/Welcome to the Personal Journal App!/i)
      ).toBeInTheDocument();
    });
  });

  it("displays login button when not authenticated", () => {
    useAuth0.mockReturnValue({
      isAuthenticated: false,
      loginWithRedirect: jest.fn(),
    });

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
  });

  it("displays logout button and user name when authenticated", async () => {
    useAuth0.mockReturnValue({
      isAuthenticated: true,
      user: { name: "John Doe" },
      logout: jest.fn(),
    });

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );
    await waitFor(() =>
      expect(screen.getByText(/Hello, John Doe!/i)).toBeInTheDocument()
    );
    expect(screen.getByRole("button", { name: /logout/i })).toBeInTheDocument();
  });
});
