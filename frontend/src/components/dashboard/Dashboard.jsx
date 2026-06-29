import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./dashboard.css";
import Navbar from "../Navbar";
import { formatDistanceToNow } from "date-fns";
import BASE_URL from '../../config.js';
const Dashboard = () => {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search") || "";

  const [repositories, setRepositories] = useState([]);
  const [suggestedRepositories, setSuggestedRepositories] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    const userId = localStorage.getItem("userId");

    const fetchRepositories = async () => {
      try {
        const response = await fetch(
          `${BASE_URL}/repo/user/${userId}`
        );

        const data = await response.json();

        setRepositories(
          Array.isArray(data.repositories) ? data.repositories : []
        );
      } catch (err) {
        console.error(err);
        setRepositories([]);
      }
    };

    const fetchSuggestedRepositories = async () => {
      try {
        const response = await fetch(`${BASE_URL}/repo/all`);

        const data = await response.json();

        if (Array.isArray(data)) {
          setSuggestedRepositories(
            data.filter(repo => repo.visibility === true)
          );
        } else if (Array.isArray(data.repositories)) {
          setSuggestedRepositories(
            data.repositories.filter(repo => repo.visibility === true)
          );
        } else {
          setSuggestedRepositories([]);
        }
      } catch (err) {
        console.error(err);
        setSuggestedRepositories([]);
      }
    };

    fetchRepositories();
    fetchSuggestedRepositories();
  }, []);

  useEffect(() => {
    setSearchResults(
      repositories.filter((repo) =>
        repo.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [repositories, searchQuery]);

  return (
    <>
      <Navbar />

      <div className="dashboard">
        {/* LEFT SIDE */}
        <div className="left">
          <h2 className="sectionTitle">Your Repositories</h2>

          {searchResults.length === 0 ? (
            <p className="emptyText">No repositories found.</p>
          ) : (
            searchResults.map((repo) => (
              <div
                  className="repoCard"
                  key={repo._id}
                  onClick={() => navigate(`/repo/${repo._id}`)}
                  style={{ cursor: "pointer" }}
                >
                <div className="repoHeader">
                  <h3>📁 {repo.name}</h3>

                  <span
                    className={
                      repo.visibility ? "visibility public" : "visibility private"
                    }
                  >
                    {repo.visibility ? "Public" : "Private"}
                  </span>
                </div>

                <p className="repoDescription">
                  {repo.description || "No description provided."}
                </p>

                <div className="repoFooter">
                  <span>⭐ {repo.stars || 0} Stars</span>
                  <span>
                    {
                      repo.lastCommitTime
                        ? `Updated ${formatDistanceToNow(
                            new Date(repo.lastCommitTime),
                            { addSuffix: true }
                          )}`
                        : "No commits yet"
                    }
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* RIGHT SIDE */}
        <div className="right">
          <h2 className="sectionTitle">Suggested Repositories</h2>

          {suggestedRepositories.map((repo) => (
            <div
                className="suggestCard"
                key={repo._id}
                onClick={() => navigate(`/repo/${repo._id}`)}
                style={{ cursor: "pointer" }}
              >
              <h3>{repo.name}</h3>

              <p>{repo.description || "No description available."}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Dashboard;