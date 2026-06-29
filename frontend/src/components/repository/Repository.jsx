import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import "./repository.css";
import { askRepoAssistant } from '../../api/ai.js';
import BASE_URL from '../../config.js';
const Repository = () => {
  const { repoId } = useParams();
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [repo, setRepo] = useState(null);
  const currentUser = localStorage.getItem("userId");
  const isOwner = repo?.owner?._id === currentUser;
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [commitMessage, setCommitMessage] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [starred, setStarred] = useState(false);
  const [starLoading, setStarLoading] = useState(false);
  const [commits, setCommits] = useState([]);
  const [readmeLoading, setReadmeLoading] = useState(false);
  const [hasReadme, setHasReadme] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatQuestion, setChatQuestion] = useState('');
  const [chatAnswer, setChatAnswer] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [showPRForm, setShowPRForm] = useState(false);
  const [prTitle, setPrTitle] = useState("");
  const [prDesc, setPrDesc] = useState("");
  const [pullRequests, setPullRequests] = useState([]);
  useEffect(() => {
    loadRepository();
    loadFiles();
    checkStar();
    loadCommits();
    loadPRs();
  }, []);

  const loadRepository = async () => {
    try {
      const response = await fetch(`${BASE_URL}/repo/${repoId}`);
      const data = await response.json();

      console.log("Repository API:", data);

      if (Array.isArray(data)) {
        setRepo(data[0]);
      } else {
        setRepo(data);
      }

    } catch (err) {
      console.log(err);
    }
  };

  const loadFiles = async () => {
    try {
      const response = await fetch(`${BASE_URL}/file/${repoId}`);
      const data = await response.json();

      if (Array.isArray(data)) {

        setFiles(data);

        const readmeExists = data.some(
          file => file.name.toLowerCase() === "readme.md"
        );

        setHasReadme(readmeExists);

      }
    } catch (err) {
      console.log(err);
    }
  };
  const loadCommits = async () => {
    try {

      const response = await fetch(
        `${BASE_URL}/commit/${repoId}`
      );

      const data = await response.json();

      setCommits(data);

    } catch (err) {
      console.log(err);
    }
  };
  const checkStar = async () => {
    try {
      const response = await fetch(
        `${BASE_URL}/starred/${currentUser}`
      );

      const data = await response.json();

      const exists = data.some((repo) => repo._id === repoId);

      setStarred(exists);

    } catch (err) {
      console.log(err);
    }
  };
  const generateAICommitMessage = async () => {

    try {

      setAiLoading(true);

      const response = await fetch(
        "${BASE_URL}/ai/commit-message",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({

            action: "Create File",

            fileName: name,

            oldContent: "",

            newContent: content

          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      setCommitMessage(data.commitMessage);

    } catch (err) {

      console.log(err);

    } finally {

      setAiLoading(false);

    }

  };
  const generateReadme = async () => {

    try {

      setReadmeLoading(true);

      const response = await fetch(
        "${BASE_URL}/ai/generate-readme",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            repoId,
            userId: currentUser
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {

        alert(data.message);

        return;

      }

      alert("README generated successfully!");

      loadFiles();
      loadCommits();

    } catch (err) {

      console.log(err);

    } finally {

      setReadmeLoading(false);

    }

  };
  const handleAskAssistant = async () => {
    if (!chatQuestion.trim()) return;
    setChatLoading(true);
    try {
      const data = await askRepoAssistant(repoId, chatQuestion);
      setChatAnswer(data.answer);
    } catch (err) {
      setChatAnswer("Something went wrong. Try again.");
    } finally {
      setChatLoading(false);
    }
  };
  const createFile = async () => {

    if (!name.trim()) {
      alert("Filename is required");
      return;
    }

    try {

      const response = await fetch(
        "${BASE_URL}/file/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            repoId,
            name,
            content,
            userId: currentUser,
            commitMessage
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      setName("");
      setContent("");
      setCommitMessage("");
      setShowForm(false);

      loadFiles();
      loadCommits();

    } catch (err) {
      console.log(err);
    }
  };

  const toggleStar = async () => {

    if (starLoading) return;

    setStarLoading(true);

    try {

      const response = await fetch(
        "${BASE_URL}/star",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: currentUser,
            repoId,
          }),
        }
      );

      const data = await response.json();

      setStarred(data.starred);

      // ⭐ Update the star count immediately
      setRepo((prev) => ({
        ...prev,
        stars: data.stars,
      }));

    } catch (err) {
      console.log(err);
    }

    setStarLoading(false);
  };

  const deleteRepository = async () => {

    const confirmDelete = window.confirm(
      "⚠️ Are you sure you want to delete this repository?\n\nThis action cannot be undone."
    );

    if (!confirmDelete) return;

    try {

      const response = await fetch(
        `${BASE_URL}/repo/delete/${repoId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: currentUser,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.error);
        return;
      }

      alert("Repository deleted successfully!");

      navigate("/");

    } catch (err) {
      console.log(err);
    }

  };
  const copyRepository = async () => {

    try {

      const response = await fetch(

        `${BASE_URL}/repo/copy/${repoId}`,

        {

          method: "POST",

          headers: {

            "Content-Type": "application/json"

          },

          body: JSON.stringify({

            userId: currentUser

          })

        }

      );

      const data = await response.json();

      if (!response.ok) {

        alert(data.message);

        return;

      }

      alert("Repository copied successfully!");

      navigate(`/repo/${data.repository._id}`);

    } catch (err) {

      console.log(err);

    }

  };
  const deleteFile = async (file) => {

    const commitMessage = prompt("Enter commit message");

    if (!commitMessage) return;

    try {

      const response = await fetch(
        `${BASE_URL}/file/${file._id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: currentUser,
            commitMessage
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      loadFiles();
      loadCommits();

    } catch (err) {
      console.log(err);
    }

  };

  const resetCommit = async (commitId) => {

    const confirmReset = window.confirm(
      "Reset repository to this commit?"
    );

    if (!confirmReset) return;

    try {

      const response = await fetch(
        `${BASE_URL}/commit/reset/${commitId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: currentUser,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      alert("Repository restored successfully!");

      // Reload everything
      loadFiles();
      loadCommits();
      loadRepository();

    } catch (err) {

      console.log(err);

    }

  };
  const loadPRs = async () => {
    try {
      const response = await fetch(`${BASE_URL}/pr/${repoId}`);
      const data = await response.json();
      setPullRequests(data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleCreatePR = async () => {
    if (!prTitle.trim()) return alert("Title is required");
    try {
      const response = await fetch("${BASE_URL}/pr/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: prTitle,
          description: prDesc,
          fromRepo: repoId,
          toRepo: repo?.forkedFrom,
          userId: currentUser,
        }),
      });
      const data = await response.json();
      if (!response.ok) return alert(data.message);
      alert("Pull request sent!");
      setShowPRForm(false);
      setPrTitle("");
      setPrDesc("");
    } catch (err) {
      console.log(err);
    }
  };

  const handleMergePR = async (prId) => {
    const confirm = window.confirm("Merge this pull request?");
    if (!confirm) return;
    try {
      const response = await fetch(`${BASE_URL}/pr/merge/${prId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser }),
      });
      const data = await response.json();
      if (!response.ok) return alert(data.message);
      alert("Merged successfully!");
      loadFiles();
      loadCommits();
      loadPRs();
    } catch (err) {
      console.log(err);
    }
  };

  const handleClosePR = async (prId) => {
    try {
      await fetch(`${BASE_URL}/pr/close/${prId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      loadPRs();
    } catch (err) {
      console.log(err);
    }
  };
  return (
    <div className="repoContainer">

      <div className="repoHeader">
        <div>
          <h1 className="repoTitle">
            {repo?.name}
          </h1>
          <p className="repoDescription">
            {repo?.description}
          </p>
          <div className="repoMeta">
            <span>
              👤 {repo?.owner?.username}
            </span>

            <span>
              {repo?.visibility ? "Public" : "Private"}
            </span>
          </div>
        </div>

        <div className="repoButtons">

          <button
            className="starButton"
            onClick={toggleStar}
          >
            ⭐ {starred ? "Starred" : "Star"} ({repo?.stars || 0})
          </button>
          {isOwner && repo?.forkedFrom && (
            <button className="askButton" onClick={() => setShowPRForm(!showPRForm)}>
              ⬆ Open Pull Request
            </button>
          )}
          {
            isOwner ? (

              <button
                className="deleteButton"
                onClick={deleteRepository}
              >
                Delete
              </button>

            ) : (

              <button
                className="copyButton"
                onClick={copyRepository}
              >
                📋 Fork Repository
              </button>

            )
          }
          <button className="askButton" onClick={() => setChatOpen(!chatOpen)}>
            Ask about this repo
          </button>

          {chatOpen && (
            <div className="chat-box">
              <textarea
                placeholder="e.g. How does authentication work here?"
                value={chatQuestion}
                onChange={e => setChatQuestion(e.target.value)}
              />
              <button onClick={handleAskAssistant} disabled={chatLoading}>
                {chatLoading ? 'Thinking...' : 'Ask'}
              </button>
              {chatAnswer && (
                <div className="chat-answer">{chatAnswer}</div>
              )}
            </div>
          )}
        </div>

      </div>
      {showPRForm && (
        <div className="chat-box">
          <h3 style={{ color: "#e6edf3", margin: "0 0 10px 0" }}>Open Pull Request</h3>
          <input
            type="text"
            placeholder="PR Title"
            value={prTitle}
            onChange={e => setPrTitle(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              background: "#0d1117",
              border: "1px solid #30363d",
              borderRadius: "6px",
              color: "#e6edf3",
              boxSizing: "border-box"
            }}
          />
          <textarea
            placeholder="Describe your changes..."
            value={prDesc}
            onChange={e => setPrDesc(e.target.value)}
            rows={4}
            style={{
              width: "100%",
              padding: "10px",
              background: "#0d1117",
              border: "1px solid #30363d",
              borderRadius: "6px",
              color: "#e6edf3",
              boxSizing: "border-box"
            }}
          />
          <button className="greenButton" onClick={handleCreatePR}>
            Submit Pull Request
          </button>
        </div>
      )}
      <hr />

      <div>
        <div className="filesCard">
          <div className="filesHeader">
            <h2>Files</h2>

            {
              isOwner &&
              <div
                style={{
                  display: "flex",
                  gap: "10px"
                }}
              >

                <button
                  className="greenButton"
                  onClick={() => setShowForm(!showForm)}
                >
                  + Add File
                </button>

                <button
                  className="greenButton"
                  onClick={generateReadme}
                  disabled={readmeLoading}
                >
                  {
                    readmeLoading
                      ? "Generating..."
                      : hasReadme
                        ? "🔄 Regenerate README"
                        : "✨ Generate README"
                  }
                </button>

              </div>
            }
          </div>
        </div>
      </div>

      {
        showForm && (
          <div className="addFileCard">
            <input
              type="text"
              placeholder="Filename (e.g. index.js)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "15px",
              }}
            />

            <textarea
              placeholder="File content..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "15px",
              }}
            />

            <input
              type="text"
              placeholder="Commit message"
              value={commitMessage}
              onChange={(e) => setCommitMessage(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                marginBottom: "15px"
              }}
            />
            <button
              onClick={generateAICommitMessage}
              disabled={aiLoading}
              style={{
                marginBottom: "15px",
                background: "#6f42c1",
                color: "white",
                padding: "10px 16px",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer"
              }}
            >
              {aiLoading ? "Generating..." : "🤖 Generate Commit Message"}
            </button>
            <button onClick={createFile}>
              Create File
            </button>
          </div>
        )
      }
      {
        files.length === 0
          ?
          <p>No files yet.</p>
          :
          files.map(file => (

            <div
              className="fileRow"
              key={file._id}
            >

              <div
                className="fileName"
                onClick={() =>
                  navigate(`/repo/${repoId}/file/${file._id}`)
                }
              >
                📄 {file.name}
              </div>
              {
                isOwner && (
                  <button
                    className="deleteFileButton"
                    onClick={() => deleteFile(file)}
                  >
                    Delete
                  </button>
                )

              }
              {
                isOwner && (<button
                  className="editFileButton"
                  onClick={() =>
                    navigate(`/repo/${repoId}/file/${file._id}`)
                  }
                >
                  Edit
                </button>)
              }
            </div>

          ))
        // herr
      }
      <hr></hr>
      <div className="commitCard">

        <h2>Commit History</h2>

        {
          commits.length === 0
            ?
            <p>No commits yet.</p>

            :

            commits.map(commit => (

              <div
                key={commit._id}
                className="commitRow"
              >

                <div>

                  <div className="commitMessage">
                    {commit.message}
                  </div>

                  <div className="commitInfo">
                    {commit.action} • {commit.fileName}
                  </div>

                  <div className="commitAuthor">
                    {commit.author?.username}
                  </div>

                </div>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-end",
                    gap: "10px"
                  }}
                >

                  <small>
                    {new Date(commit.createdAt).toLocaleString()}
                  </small>

                  {
                    isOwner && (
                      <button
                        className="resetButton"
                        onClick={() => resetCommit(commit._id)}
                      >
                        Reset Here
                      </button>
                    )
                  }

                </div>

              </div>

            ))
        }
      </div>
          {isOwner && pullRequests.length > 0 && (
  <div className="commitCard">
    <h2>Pull Requests</h2>
    {pullRequests.map(pr => (
      <div key={pr._id} className="commitRow">
        <div>
          <div className="commitMessage">{pr.title}</div>
          <div className="commitInfo">{pr.description}</div>
          <div className="commitAuthor">
            from {pr.fromRepo?.name} by {pr.author?.username}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className="greenButton" onClick={() => handleMergePR(pr._id)}>
            Merge
          </button>
          <button className="deleteButton" onClick={() => handleClosePR(pr._id)}>
            Close
          </button>
        </div>
      </div>
    ))}
  </div>
)}
    </div>

  );
};

export default Repository;