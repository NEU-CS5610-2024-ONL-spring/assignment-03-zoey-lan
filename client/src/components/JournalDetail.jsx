import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import "../style/JournalDetail.css";
//import useStarJournal from "../hooks/useStarJournal";

const JournalDetail = () => {
  const { journalId } = useParams();
  const [journal, setJournal] = useState({});
  const { isAuthenticated, user, getAccessTokenSilently } = useAuth0();
  const [star, setStar] = useState(0);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    const fetchJournal = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/journals/${journalId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch journal details");
        }
        const data = await response.json();
        //console.log(data.creator.name);
        setJournal(data);
        setStar(data.star);
        console.log(journal);
      } catch (err) {
        console.log("error fetch journal");
      }
    };

    fetchJournal();
  }, [refetchTrigger]); // Depend on journalId to refetch if it changes

  const handleStarJournal = async (journalId) => {
    if (!isAuthenticated) {
      window.alert("please log in");
      return;
    } // Ensure user is logged in

    try {
      const isStarred = journal.starredBy.some((u) => u.auth0Id === user.sub);
      console.log(isStarred);
      console.log(journal.starredBy);
      console.log(user.sub);
      if (isStarred) {
        setStar((e) => e - 1);
      } else {
        setStar((e) => e + 1);
      }
      const token = await getAccessTokenSilently();
      // API call to toggle star status
      await fetch(
        `${process.env.REACT_APP_API_URL}/journals/${journalId}/${
          isStarred ? "unstar" : "star"
        }`,
        {
          method: "POST", // Specifies that this is a POST request
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json", // Include or exclude based on your API's requirements for an empty body
          },
          body: JSON.stringify({}), // If your API does not require a body, this line can be omitted
        }
      );
      setRefetchTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to star journal:", error);
    }
  };

  return (
    <div>
      <h2>{journal.title}</h2>
      <p>{journal.journalText}</p>
      <p>Star: {star}</p>
      <p>Created At: {new Date(journal.createdAt).toLocaleDateString()}</p>
      <p>Last Updated: {new Date(journal.updatedAt).toLocaleDateString()}</p>
      {/* <p>Creator: {journal.creator.name}</p> */}
      {/* <button onClick={() => toggleStar(journal.id, setRefetchTrigger)}>
        Star/Unstar
      </button> */}
      <button onClick={() => handleStarJournal(journal.id)}>Star/Unstar</button>
    </div>
  );
};

export default JournalDetail;
