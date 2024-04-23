import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import { useAuthToken } from "../AuthTokenContext";
import "../style/Journal.css";
//import useStarJournal from "../hooks/useStarJournal";
//import useJournals from "../hooks/useJournals";
const Journals = () => {
  const { isAuthenticated, user, getAccessTokenSilently } = useAuth0();
  const [journalItems, setJournalItems] = useState([]);
  // State for the new journal's title
  const [newJournalTitle, setNewJournalTitle] = useState("");
  // State for the new journal's text
  const [newJournalText, setNewJournalText] = useState("");
  //A trigger for refetch journals
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  //const toggleStar = useStarJournal();
  const navigate = useNavigate();
  const { accessToken } = useAuthToken();

  // Fetch and sort journals by star count in descending order
  useEffect(() => {
    const fetchJournals = async () => {
      try {
        // const response = await axios.get("/api/journals");
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/journals`,
          {
            //method:"GET", //GET is default
            //no need to add content type
            headers: {
              // Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        const journals = await response.json(); // 用axios时用不着这一步
        //Get the top 10 most starred journals
        const sortedJournals = journals
          .sort((a, b) => b.star - a.star)
          .slice(0, 10);
        setJournalItems(sortedJournals);
      } catch (error) {
        console.error("Failed to fetch journals:", error);
      }
    };

    fetchJournals();
  }, [refetchTrigger]);

  const handleCreateJournal = async () => {
    //ensure user is logged in
    if (!isAuthenticated) {
      window.alert("please log in");
      return;
    }

    try {
      //   const data =
      await fetch(`${process.env.REACT_APP_API_URL}/journals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          title: newJournalTitle,
          journalText: newJournalText,
        }),
      });
      // Reset form fields after submission
      setNewJournalTitle("");
      setNewJournalText("");
      // Re-fetch journals here to update the list
      setRefetchTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to create journal:", error);
    }
  };

  const handleStarJournal = async (journalId) => {
    if (!isAuthenticated) {
      window.alert("please log in");
      return;
    } // Ensure user is logged in

    try {
      const journal = journalItems.find((j) => j.id === journalId);
      console.log(journal);
      const isStarred = journal.starredBy.some((u) => u.auth0Id === user.sub);
      console.log(isStarred);

      const token = await getAccessTokenSilently();
      // API call to toggle star status
      await fetch(
        `${process.env.REACT_APP_API_URL}/journals/${journalId}/${
          isStarred ? "unstar" : "star"
        }`,
        {
          method: "POST", // Specifies the method
          headers: {
            // Headers content
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json", // Set appropriately if your API expects a JSON content type header
          },
          body: JSON.stringify({}), // Since the body is mentioned to be empty, it's included as an empty JSON object here. If your endpoint does not expect a body at all, you might omit this line.
        }
      );
      // Re-fetch journals here since the rank might be changed
      setRefetchTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to star journal:", error);
    }
  };

  return (
    <div>
      <div>
        <input
          type="text"
          placeholder="New Journal Title"
          value={newJournalTitle}
          onChange={(e) => setNewJournalTitle(e.target.value)}
        />
        <textarea
          placeholder="Journal Text"
          value={newJournalText}
          onChange={(e) => setNewJournalText(e.target.value)}
        />
        <button onClick={handleCreateJournal}>Create Journal</button>
      </div>

      <div>
        {journalItems.map((journal) => (
          <div key={journal.id}>
            <p>Title: {journal.title}</p>
            <p>Creator: {journal.creator.name}</p>
            <button onClick={() => navigate(`/app/journals/${journal.id}`)}>
              Detail
            </button>
            <button onClick={() => handleStarJournal(journal.id)}>
              Star/Unstar
            </button>
            {/* <button onClick={() => toggleStar(journal.id, setRefetchTrigger)}>
              Star/Unstar
            </button> */}
            <p>star:{journal.star}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Journals;
