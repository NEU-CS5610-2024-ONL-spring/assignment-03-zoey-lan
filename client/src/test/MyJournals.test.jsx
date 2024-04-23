import React from "react";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useAuth0 } from "@auth0/auth0-react";
import MyJournals from "../components/MyJournals";
import { BrowserRouter } from "react-router-dom";

jest.mock("@auth0/auth0-react");
jest.mock("../AuthTokenContext", () => ({
  useAuthToken: () => ({ accessToken: "mocked_access_token" }),
}));

// Mocking successful fetch response for user data
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        starredJournals: [
          {
            id: "1",
            title: "Starred Journal 1",
            journalText: "Sample text for starred journal 1",
          },
          // Add more starred journals if needed
        ],
        createdJournals: [
          {
            id: "2",
            title: "Created Journal 1",
            journalText: "Sample text for created journal 1",
          },
          // Add more created journals if needed
        ],
      }),
  })
);

describe("MyJournals Component", () => {
  beforeEach(() => {
    // Reset mocks before each test
    fetch.mockClear();
    useAuth0.mockReturnValue({
      isAuthenticated: true,
      user: { sub: "user_id" },
      getAccessTokenSilently: jest.fn(() => "fake_token"),
    });
  });

  // Example test for expanding journal text
  it("expands journal text on click", async () => {
    render(
      <BrowserRouter>
        <MyJournals />
      </BrowserRouter>
    );
    const journalText = await screen.findByText(
      /^Sample text for created journal 1...$/
    );
    fireEvent.click(journalText);
    await waitFor(() => {
      expect(
        screen.getByText("Sample text for created journal 1")
      ).toBeInTheDocument();
    });
  });

  // Additional tests can be added here for un-starring, editing, and deleting journals
  // Make sure to mock fetch for delete and unstar actions and simulate user interactions
});
