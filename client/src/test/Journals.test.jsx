import React from "react";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BrowserRouter as Router } from "react-router-dom";
import { BrowserRouter } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import Journals from "../components/Journals";

jest.mock("@auth0/auth0-react");

jest.mock("../AuthTokenContext", () => ({
  useAuthToken: () => ({ accessToken: "mocked_access_token" }),
}));

// Mocking useNavigate hook
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn(),
}));

// Example mock data for journals
const mockJournals = [
  { id: "1", title: "Journal 1", creator: { name: "User 1" }, star: 5 },
  // Add more mock journal entries as needed
];

// Mock fetch implementation to return mock journals
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve(mockJournals),
  })
);

describe("Journals Component", () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    fetch.mockClear();
    useAuth0.mockReturnValue({ isAuthenticated: true });
  });

  it("fetches and displays journal entries", async () => {
    render(
      <BrowserRouter>
        <Journals />
      </BrowserRouter>
    );

    // Wait for the component to finish loading the journals
    await waitFor(() => {
      expect(screen.getByText(/Journal 1/i)).toBeInTheDocument();
    });
  });

  // Test cases for creating a new journal, starring/unstarring journals, and navigation can follow a similar pattern
  // Remember to mock API calls and user interactions accordingly
});
