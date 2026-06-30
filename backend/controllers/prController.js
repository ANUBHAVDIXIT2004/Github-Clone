const PullRequest = require("../models/pullRequestModel");
const File = require("../models/File");
const Repository = require("../models/repoModel");
const VersionControl = require("../services/VersionControl");

// Forked repo owner opens a PR
const createPR = async (req, res) => {
  try {
    const { title, description, fromRepo, toRepo, userId } = req.body;

    const pr = await PullRequest.create({
      title,
      description,
      fromRepo,
      toRepo,
      author: userId,
    });
    // Find the owner of the target repo
    const targetRepo = await Repository.findById(toRepo);

    // Emit notification to the repo owner's room
    if (global.io && targetRepo) {
      global.io.to(targetRepo.owner.toString()).emit("newPR", {
        message: `New pull request: "${title}"`,
        repoId: toRepo,
        prId: pr._id,
      });
    }
    res.status(201).json({ success: true, pr });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// Get all PRs for a repo (owner sees these)
const getPRs = async (req, res) => {
  try {
    const { repoId } = req.params;
    const prs = await PullRequest.find({ toRepo: repoId, status: "open" })
      .populate("author", "username")
      .populate("fromRepo", "name");
    res.json(prs);
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

// Owner merges PR — copies files from fromRepo into toRepo
const mergePR = async (req, res) => {
  try {
    const { prId } = req.params;
    const { userId } = req.body;

    const pr = await PullRequest.findById(prId);
    if (!pr) return res.status(404).json({ message: "PR not found" });

    const toRepo = await Repository.findById(pr.toRepo);
    if (toRepo.owner.toString() !== userId) {
      return res.status(403).json({ message: "Only the owner can merge" });
    }

    // Get all files from the forked repo
    const forkedFiles = await File.find({ repo: pr.fromRepo });

    // Replace files in the original repo
    await File.deleteMany({ repo: pr.toRepo });

    for (const file of forkedFiles) {
      await File.create({
        repo: pr.toRepo,
        name: file.name,
        content: file.content,
        createdBy: userId,
      });
    }

    // Create a commit for the merge
    await VersionControl.commit({
      repoId: pr.toRepo,
      userId,
      message: `Merged pull request: ${pr.title}`,
      action: "MERGE",
      fileName: "all files",
    });

    pr.status = "merged";
    await pr.save();

    res.json({ success: true, message: "PR merged successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

// Close a PR without merging
const closePR = async (req, res) => {
  try {
    const { prId } = req.params;
    const pr = await PullRequest.findByIdAndUpdate(
      prId,
      { status: "closed" },
      { new: true }
    );
    res.json({ success: true, pr });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

module.exports = { createPR, getPRs, mergePR, closePR };