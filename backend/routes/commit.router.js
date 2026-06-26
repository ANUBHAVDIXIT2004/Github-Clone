const express = require("express");
const router = express.Router();

const {
    createCommit,
    getCommits
} = require("../controllers/commitController");

router.post("/create", createCommit);

router.get("/:repoId", getCommits);

module.exports = router;