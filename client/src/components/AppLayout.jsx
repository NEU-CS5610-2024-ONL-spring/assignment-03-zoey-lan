import "../style/appLayout.css";
import { Outlet, Link } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";

export default function AppLayout() {
  const { isAuthenticated, user, isLoading, logout, loginWithRedirect } =
    useAuth0();

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="app">
      <div className="title">
        <h1>Personal Journal App</h1>
      </div>
      <div className="header">
        <nav className="menu">
          <ul className="menu-list">
            <li>
              <Link to="/">Go Home</Link>
            </li>
            <li>
              <Link to="/app">My Journals</Link>
            </li>
            <li>
              <Link to="/app/Journals">Journals</Link>
            </li>
            {/* <li>
              <Link to="/app/Users">Journals</Link>
            </li> */}
            <li>
              <Link to="/app/debugger">Auth Debugger</Link>
            </li>
            <li>
              {/* <button
                className="exit-button"
                onClick={() => logout({ returnTo: window.location.origin })}
              >
                LogOut
              </button> */}
              {isAuthenticated ? (
                <button
                  className="exit-button"
                  onClick={() => logout({ returnTo: window.location.origin })}
                >
                  Logout
                </button>
              ) : (
                <button
                  className="login-button"
                  onClick={() => loginWithRedirect()}
                >
                  Login
                </button>
              )}
            </li>
          </ul>
        </nav>
        <div>Welcome 👋 {isAuthenticated ? user.name : "Friend"}</div>
      </div>
      <div className="content">
        <Outlet />
      </div>
    </div>
  );
}
