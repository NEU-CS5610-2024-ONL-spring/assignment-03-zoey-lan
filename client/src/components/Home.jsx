import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Link } from "react-router-dom";
import "../style/Home.css"; // Assuming you have a CSS file for styling

const Home = () => {
  const {
    isAuthenticated,
    loginWithRedirect,
    user,
    getAccessTokenSilently,
    logout,
  } = useAuth0();
  const [topStarredJournals, setTopStarredJournals] = useState([]);
  const [recentUserJournals, setRecentUserJournals] = useState([]);
  const [joke, setJoke] = useState({});

  // Fetch top starred journals
  useEffect(() => {
    const fetchTopStarredJournals = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/journals`
        );
        if (!response.ok) {
          return null;
        }
        const data = await response.json();
        //Get the top 10 most starred journals
        const sortedJournals = data
          .sort((a, b) => b.star - a.star)
          .slice(0, 10);
        setTopStarredJournals(sortedJournals);
      } catch (error) {
        console.error("Error fetching top starred journals:", error);
      }
    };

    fetchTopStarredJournals();
  }, []);

  // Fetch recent journals created by the user if logged in
  useEffect(() => {
    const fetchRecentUserJournals = async () => {
      if (!isAuthenticated) return;

      try {
        const accessToken = await getAccessTokenSilently();
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/users/profile`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        if (!response.ok) {
          return null;
        }
        const data = await response.json();
        //console.log(data);
        //const journals = [...data.createdJournals];
        const journals = Array.isArray(data.starredJournals)
          ? data.starredJournals
          : [];
        //Get the top 10 most starred journals
        const sortedJournals = journals
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 10);

        setRecentUserJournals(sortedJournals);
      } catch (error) {
        console.error("Error fetching user's recent journals:", error);
      }
    };
    fetchRecentUserJournals();
  }, [isAuthenticated, user?.id, getAccessTokenSilently]);

  //fetch the external api to get joke of the day
  useEffect(() => {
    const fetchJoke = async () => {
      try {
        const response = await fetch(
          "https://world-of-jokes1.p.rapidapi.com/v1/jokes/joke-of-the-day",
          {
            headers: {
              // 'X-RapidAPI-Key': 'YOUR_RAPIDAPI_KEY_HERE', // Replace with your RapidAPI Key
              "X-RapidAPI-Key":
                "75b4b1f940msh0f0bf56bed4476ep110d21jsn79e70e77c502",
              "X-RapidAPI-Host": "world-of-jokes1.p.rapidapi.com",
            },
          }
        );
        if (response.ok) {
          const data = await response.json();

          setJoke(data); // Adjust this line based on the actual structure of the response
          console.log(data);
        } else {
          throw new Error("Network response was not ok.");
        }
      } catch (error) {
        console.error("Error fetching joke:", error);
      }
    };

    fetchJoke();
  }, []);

  return (
    <div className="home-page">
      <div className="title">
        <h1>Well Come To Personal Journal App!</h1>
      </div>
      <div className="block block-login-welcome">
        {isAuthenticated ? (
          <div>
            <p>Hello, {user.name}!</p>
            <button
              onClick={() => logout({ returnTo: window.location.origin })}
            >
              {"    "} Logout
            </button>
          </div>
        ) : (
          <button onClick={() => loginWithRedirect()}>Log In</button>
        )}
      </div>

      {/* Block 2: Top starred journals */}
      <div className="block block-top-starred">
        <h2>Top Starred Journals</h2>
        <ul>
          {topStarredJournals.map((journal) => (
            <li key={journal.id}>
              <span style={{ fontWeight: "bold", color: "blue" }}>title:</span>
              <span style={{ color: "gray" }}>{journal.title}</span>
              <span
                style={{
                  fontWeight: "bold",
                  color: "blue",
                  marginLeft: "10px",
                }}
              >
                star:
              </span>
              <span style={{ color: "gray" }}>{journal.star}</span>
            </li>
          ))}
        </ul>
        <Link to="/app/journals">Explore Journals</Link>
      </div>

      {/* Block 3: Recent journals by the user (for logged in users only) */}
      {isAuthenticated && (
        <div className="block block-recent-user-journals">
          <h2>Your Recent Journals</h2>
          <ul>
            {recentUserJournals.map((journal) => (
              <li key={journal.id}>{journal.title}</li>
            ))}
          </ul>
          <Link to="/app">Go to My Journals</Link>
        </div>
      )}

      {/* Block 4: joke block */}
      <div className="joke-container">
        <h2>Joke of the Day</h2>
        <p style={{ fontWeight: "bold", color: "blue" }}>{joke.title}</p>
        <p style={{ color: "gray" }}>{joke.body}</p>
      </div>
    </div>
  );
};

export default Home;
