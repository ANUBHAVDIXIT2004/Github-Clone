import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./profile.css";
import Navbar from "../Navbar";
import { UnderlineNav } from "@primer/react";
import { BookIcon, RepoIcon } from "@primer/octicons-react";
import HeatMapProfile from "./HeatMap";
import { useAuth } from "../../authContext";
import BASE_URL from '../../config.js';
const Profile = () => {
  const navigate = useNavigate();
  const { setCurrentUser } = useAuth();

  const [userDetails, setUserDetails] = useState({ username: "username" });
  const [starredRepos, setStarredRepos] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchUserDetails();
  }, []);

  const fetchUserDetails = async () => {
    const userId = localStorage.getItem("userId");

    try {
      const response = await axios.get(
        `${BASE_URL}/userProfile/${userId}`
      );

      setUserDetails(response.data);
    } catch (err) {
      console.log(err);
    }
  };

  const fetchStarredRepos = async () => {
    try {
      const userId = localStorage.getItem("userId");

      const response = await axios.get(
        `${BASE_URL}/starred/${userId}`
      );

      setStarredRepos(response.data);

    } catch (err) {
      console.log(err);
    }
  };

  return (
    <>
      <Navbar />

      <UnderlineNav aria-label="Repository">
        <UnderlineNav.Item
          aria-current={activeTab === "overview" ? "page" : undefined}
          icon={BookIcon}
          onClick={() => setActiveTab("overview")}
          sx={{
            backgroundColor: "transparent",
            color: "white",
          }}
        >
          Overview
        </UnderlineNav.Item>

        <UnderlineNav.Item
          aria-current={activeTab === "starred" ? "page" : undefined}
          icon={RepoIcon}
          onClick={() => {
            setActiveTab("starred");
            fetchStarredRepos();
          }}
          sx={{
            backgroundColor: "transparent",
            color: "white",
          }}
        >
          Starred Repositories
        </UnderlineNav.Item>
      </UnderlineNav>

      <div className="profileActions">

          <button
              className="logoutBtn"
              // ✅ fix
onClick={() => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    setCurrentUser(null);
    navigate("/auth");
}}
          >
              Logout
          </button>

      </div>

      {activeTab === "overview" && (
        <div className="profile-page-wrapper">

          <div className="user-profile-section">

            <div className="profile-image"></div>

            <div className="name">
              <h3>{userDetails.username}</h3>
            </div>

            <button className="follow-btn">
              Follow
            </button>

            <div className="follower">
              <p>10 Followers</p>
              <p>3 Following</p>
            </div>

          </div>

          <div className="heat-map-section">
            <HeatMapProfile />
          </div>

        </div>
      )}

      {activeTab === "starred" && (

        <div
          style={{
            maxWidth: "900px",
            margin: "40px auto",
            padding: "20px",
          }}
        >

          <h2>⭐ Starred Repositories</h2>

          {starredRepos.length === 0 ? (
            <p>No starred repositories.</p>
          ) : (
            starredRepos.map((repo) => (
              <div
                key={repo._id}
                onClick={() => navigate(`/repo/${repo._id}`)}
                style={{
                  marginTop: "20px",
                  padding: "20px",
                  border: "1px solid #30363d",
                  borderRadius: "10px",
                  cursor: "pointer",
                  transition: "0.2s",
                }}
              >
                <h3>{repo.name}</h3>

                <p>{repo.description || "No description"}</p>
              </div>
            ))
          )}

        </div>

      )}
    </>
  );
};

export default Profile;