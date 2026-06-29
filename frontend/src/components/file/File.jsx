import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { reviewCode } from "../../api/ai";
import BASE_URL from '../../config.js';
const File = () => {
  const { fileId } = useParams();

  const [file, setFile] = useState(null);
  const [editing, setEditing] = useState(false);

  const [content, setContent] = useState("");

  const [commitMessage, setCommitMessage] = useState("");
  const [showReview, setShowReview] = useState(false);
  const [loading, setLoading] = useState(false);
const [review, setReview] = useState("");
  const currentUser = localStorage.getItem("userId");
  useEffect(() => {
    loadFile();
  }, []);

  const loadFile = async () => {
    try {
      const response = await fetch(`${BASE_URL}/file/view/${fileId}`);
      const data = await response.json();
      setFile(data);
      setContent(data.content);
    } catch (err) {
      console.log(err);
    }
  };
  const handleAIReview = async () => {

    try {

      setLoading(true);

      const extension = file?.name?.split(".").pop() || "txt";

const res = await reviewCode(
    content,
    extension
);

      setReview(

        res.review

      );

      setShowReview(true);

    }

    catch (err) {

      console.log(err);

    }

    finally {

      setLoading(false);

    }

  }
  const saveChanges = async () => {

    if (!commitMessage.trim()) {
      alert("Commit message required");
      return;
    }

    try {

      const response = await fetch(

        `${BASE_URL}/file/edit/${fileId}`,

        {

          method: "PUT",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({

            content,

            userId: currentUser,

            commitMessage

          })

        }

      );

      const data = await response.json();

      if (!response.ok) {

        alert(data.message);

        return;

      }

      alert("File updated successfully!");

      setEditing(false);

      setCommitMessage("");

      loadFile();

    }

    catch (err) {

      console.log(err);

    }

  };
  return (
    <div style={{ padding: "30px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>{file?.name}</h2>

        <button
          onClick={() => {
            console.log("Edit button clicked");
            setEditing((prev) => !prev);
          }}
        >
          {editing ? "Cancel" : "Edit"}
        </button>
      </div>

      <hr />

      {editing ? (
        <>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={22}
            style={{
              width: "100%",
              padding: "20px",
              fontFamily: "monospace",
              fontSize: "15px",
              borderRadius: "8px",
              marginBottom: "20px",
            }}
          />

          <input
            type="text"
            placeholder="Enter Commit Message"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            style={{
              width: "100%",
              padding: "12px",
              marginBottom: "20px",
            }}
          />

          <button
            onClick={saveChanges}
            style={{
              background: "#2da44e",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Save Changes
          </button>
          {/* <button

            onClick={handleAIReview}

            disabled={loading}

          >

            {

              loading

                ?

                "Reviewing..."

                :

                "🤖 Review with AI"

            }

          </button> */}
          {/* {showReview && (
  <div
    style={{
      marginTop: "20px",
      padding: "15px",
      border: "1px solid #ccc",
      borderRadius: "8px",
      background: "#f5f5f5",
      whiteSpace: "pre-wrap",
    }}
  >
    <h3>🤖 AI Review</h3>
    <p>{review}</p>
  </div>
)} */}
        </>
      ) : (
        <pre
          style={{
            background: "#ffffff",
            color: "#000000",
            padding: "20px",
            border: "1px solid #d0d7de",
            borderRadius: "8px",
            whiteSpace: "pre-wrap",
            minHeight: "400px",
            fontFamily: "monospace",
            fontSize: "15px",
          }}
        >
          {content}
        </pre>
      )}
    </div>
  );
};

export default File;