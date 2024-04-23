import React, { useState, useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import "../style/MyJournal.css"; // Import your CSS for styling

const MyJournals = () => {
  const { user, isAuthenticated, getAccessTokenSilently } = useAuth0();
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();
  const [expandedJournal, setExpandedJournal] = useState(null); // Track expanded journal for text viewing
  const [isEditing, setIsEditing] = useState(false);
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  // Change from separate title and text states to a single state object
  const [editingJournal, setEditingJournal] = useState({
    id: null,
    title: "",
    text: "",
  });

  //fetch data
  useEffect(() => {
    const fetchUserData = async () => {
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
        if (!response.ok) throw new Error("Failed to fetch user data");
        const data = await response.json();
        setUserData(data);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [isAuthenticated, user?.id, getAccessTokenSilently, refetchTrigger]);

  const toggleExpandText = (journalId) => {
    setExpandedJournal((prev) => (prev === journalId ? null : journalId));
  };

  // handler for the unstar operation
  const handleUnstar = async (journalId) => {
    // Unstar logic here
    if (!isAuthenticated) return; // Ensure user is logged in

    try {
      const accessToken = await getAccessTokenSilently();
      // API call to toggle star status
      await fetch(
        `${process.env.REACT_APP_API_URL}/journals/${journalId}/unstar`,
        {
          method: "POST", // Specifies the method
          headers: {
            // Headers content
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json", // Often required, especially if you're sending JSON data. Might not be necessary for an empty POST but included for completeness.
          },
          body: JSON.stringify({}), // Since you're sending an empty object, stringify it. If no data was to be sent, you could also omit the body property entirely.
        }
      );
      setRefetchTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to unstar journal:", error);
    }
  };

  // handler for editing a journal
  //   const handleEdit = (journalId) => {
  //     // Edit logic here
  //   };
  const handleEditStart = (journal) => {
    setIsEditing(true);
    // setEditedTitle(journal.title);
    // setEditedText(journal.journalText);
    setEditingJournal({
      id: journal.id,
      title: journal.title,
      text: journal.journalText,
    });
  };
  const handleEditSave = async () => {
    if (!isAuthenticated) {
      alert("Please log in to edit journals.");
      return;
    }

    try {
      const accessToken = await getAccessTokenSilently();
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/journals/${editingJournal.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            title: editingJournal.title,
            journalText: editingJournal.text,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to update journal");

      // Handle successful update
      setIsEditing(false);
      setRefetchTrigger((prev) => prev + 1);
      // Optionally, refetch or update local journal state to reflect the changes
    } catch (error) {
      console.error("Error updating journal:", error);
    }
  };

  if (isEditing) {
    return (
      <div>
        <input
          type="text"
          value={editingJournal.title}
          onChange={(e) =>
            setEditingJournal({ ...editingJournal, title: e.target.value })
          }
        />
        <textarea
          value={editingJournal.text}
          onChange={(e) =>
            setEditingJournal({ ...editingJournal, text: e.target.value })
          }
        />
        <button onClick={handleEditSave}>Save Changes</button>
        <button onClick={() => setIsEditing(false)}>Cancel</button>
      </div>
    );
  }
  const handleDeleteJournal = async (journalId) => {
    if (!isAuthenticated) {
      alert("Please log in to delete journals.");
      return;
    }

    try {
      const accessToken = await getAccessTokenSilently();
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/journals/${journalId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete journal");
      }

      // On successful deletion, update the local state to remove the deleted journal
      setUserData((prevData) => ({
        ...prevData,
        createdJournals: prevData.createdJournals.filter(
          (journal) => journal.id !== journalId
        ),
      }));
    } catch (error) {
      console.error("Error deleting journal:", error);
    }
  };

  if (!userData) return <div>Loading or not authenticated...</div>;

  return (
    <div className="my-journals-container">
      <div className="starred-journals">
        <h2>Starred Journals</h2>
        {userData.starredJournals.map((journal) => (
          <div key={journal.id} className="journal-entry">
            <p>Title: {journal.title}</p>
            {/* <p>Creator: {journal.creator.name}</p> */}
            <button onClick={() => handleUnstar(journal.id)}>Unstar</button>
            <button onClick={() => navigate(`/app/journals/${journal.id}`)}>
              Detail
            </button>
          </div>
        ))}
      </div>
      <div className="created-journals">
        <h2>Created Journals</h2>
        {userData.createdJournals.map((journal) => (
          <div key={journal.id} className="journal-entry">
            <p>Title: {journal.title}</p>
            <div>
              <p
                onClick={() => toggleExpandText(journal.id)}
                className="journal-text"
              >
                {expandedJournal === journal.id
                  ? journal.journalText
                  : `${journal.journalText.substring(0, 100)}...`}
              </p>
            </div>
            {/* <button onClick={() => handleEdit(journal.id)}>Edit</button> */}
            <button onClick={() => handleEditStart(journal)}>Edit</button>
            <button onClick={() => handleDeleteJournal(journal.id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyJournals;
