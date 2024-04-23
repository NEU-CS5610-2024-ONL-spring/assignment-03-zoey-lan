import React from "react";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useParams } from "react-router-dom";
import JournalDetail from "../components/JournalDetail";

jest.mock("@auth0/auth0-react");
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: jest.fn(),
}));

// Mocking successful fetch response for journal details
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        id: "1",
        title: "Sample Journal",
        journalText: "This is a sample journal text.",
        createdAt: "2021-01-01T00:00:00.000Z",
        updatedAt: "2021-01-02T00:00:00.000Z",
        star: 5,
        starredBy: [], // Assume no users have starred this yet for simplicity
      }),
  })
);

describe("JournalDetail Component", () => {
  beforeEach(() => {
    // Reset mocks before each test
    fetch.mockClear();
    useParams.mockReturnValue({ journalId: "1" });
    useAuth0.mockReturnValue({
      isAuthenticated: true,
      user: { sub: "user_id" },
      getAccessTokenSilently: jest.fn(() => "fake_token"),
    });
  });

  it("renders and displays journal details", async () => {
    render(<JournalDetail />);
    await waitFor(() => {
      expect(screen.getByText("Sample Journal")).toBeInTheDocument();
      expect(
        screen.getByText("This is a sample journal text.")
      ).toBeInTheDocument();
      expect(screen.getByText("Star: 5")).toBeInTheDocument();
    });
  });

  // Example test for the star/unstar functionality
  it("allows authenticated user to star/unstar a journal", async () => {
    render(<JournalDetail />);
    const starButton = screen.getByText("Star/Unstar");
    fireEvent.click(starButton);
    // Since the mock API call doesn't actually change the star count,
    // this would ideally check if `fetch` was called correctly.
    // Further, you'd likely need to adjust the mock to simulate changing star count.
  });
});
