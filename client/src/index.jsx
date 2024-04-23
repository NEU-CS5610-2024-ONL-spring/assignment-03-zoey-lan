import React from "react";
import * as ReactDOMClient from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NotFound from "./components/NotFound";
import Home from "./components/Home";
import AppLayout from "./components/AppLayout";
import MyJournals from "./components/MyJournals";
import JournalDetail from "./components/JournalDetail";
import Journals from "./components/Journals";
import VerifyUser from "./components/VerifyUser";
import AuthDebugger from "./components/AuthDebugger";
import { Auth0Provider, useAuth0 } from "@auth0/auth0-react";
import { AuthTokenProvider } from "./AuthTokenContext";

const container = document.getElementById("root");
const root = ReactDOMClient.createRoot(container);

const requestedScopes = ["profile", "email"];
function RequireAuth({ children }) {
  const { isAuthenticated, isLoading } = useAuth0();

  // If the user is not authenticated, redirect to the home page
  if (!isLoading && !isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Otherwise, display the children (the protected page)
  return children;
}

root.render(
  <React.StrictMode>
    <Auth0Provider
      domain={process.env.REACT_APP_AUTH0_DOMAIN}
      clientId={process.env.REACT_APP_AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: `${window.location.origin}/verify-user`, //为啥呢，这个东西没用
        //redirect_uri: `http://localhost:3000/verify-user`,
        audience: process.env.REACT_APP_AUTH0_AUDIENCE,
        scope: requestedScopes.join(" "),
      }}
    >
      <AuthTokenProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/verify-user" element={<VerifyUser />} />
            <Route path="*" element={<NotFound />} />
            <Route path="app" element={<AppLayout />}>
              <Route
                index
                element={
                  <RequireAuth>
                    <MyJournals />
                  </RequireAuth>
                }
              />
              <Route path="journals" element={<Journals />} />
              <Route path="journals/:journalId" element={<JournalDetail />} />
              {/* <Route path="users" element={<Users />} /> */}
              {/* <Route path="users/:userId" element={<UserDetail />} /> */}
              <Route path="debugger" element={<AuthDebugger />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthTokenProvider>
    </Auth0Provider>
  </React.StrictMode>
);
