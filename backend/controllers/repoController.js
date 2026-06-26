const mongoose = require("mongoose");
const Repository = require("../models/repoModel");
const User = require("../models/userModel");
const Issue = require("../models/issueModel");
const Commit = require("../models/commitModel");

async function createRepository(req, res) {
  const { owner, name, issues, content, description, visibility } = req.body;

  try {
    if (!name) {
      return res.status(400).json({ error: "Repository name is required!" });
    }

    if (!mongoose.Types.ObjectId.isValid(owner)) {
      return res.status(400).json({ error: "Invalid User ID!" });
    }

    const newRepository = new Repository({
      name,
      description,
      visibility,
      owner,
      content,
      issues,
    });

    const result=await newRepository.save();

    await User.findByIdAndUpdate(owner,{
        $push:{
            repositories:result._id
        }
    });

    res.status(201).json({

    message:"Repository created!",
    repositoryID:result._id

    });
  } catch (err) {
    console.error("Error during repository creation : ", err.message);
    res.status(500).send("Server error");
  }
}

async function getAllRepositories(req, res) {
  try {

    const repositories = await Repository.find({})
      .populate("owner")
      .populate("issues");

    const repos = await Promise.all(

      repositories.map(async (repo) => {

        const lastCommit = await Commit.findOne({
          repo: repo._id
        }).sort({ createdAt: -1 });

        return {
          ...repo.toObject(),
          lastCommitTime: lastCommit ? lastCommit.createdAt : null
        };

      })

    );

    res.json(repos);

  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
}

async function fetchRepositoryById(req, res) {
  const { id } = req.params;

  try {
    const repository = await Repository.findById(id)
      .populate("owner")
      .populate("issues");

    if (!repository) {
      return res.status(404).json({
        error: "Repository not found!"
      });
    }

    res.json(repository);

  } catch (err) {
    console.error("Error during fetching repository : ", err.message);
    res.status(500).send("Server error");
  }
}

async function fetchRepositoryByName(req, res) {
  const { name } = req.params;
  try {
    const repository = await Repository.find({ name })
      .populate("owner")
      .populate("issues");

    res.json(repository);
  } catch (err) {
    console.error("Error during fetching repository : ", err.message);
    res.status(500).send("Server error");
  }
}

async function fetchRepositoriesForCurrentUser(req, res) {

  const { userID } = req.params;

  try {

    const repositories = await Repository.find({
      owner: userID
    });

    const repos = await Promise.all(

      repositories.map(async (repo) => {

        const lastCommit = await Commit.findOne({
          repo: repo._id
        }).sort({ createdAt: -1 });

        return {
          ...repo.toObject(),
          lastCommitTime: lastCommit ? lastCommit.createdAt : null
        };

      })

    );

    res.json({
      message: "Repositories found!",
      repositories: repos
    });

  } catch (err) {

    console.error(err);

    res.status(500).send("Server error");

  }

}

async function updateRepositoryById(req, res) {
  const { id } = req.params;
  const { content, description } = req.body;

  try {
    const repository = await Repository.findById(id);
    if (!repository) {
      return res.status(404).json({ error: "Repository not found!" });
    }

    repository.content.push(content);
    repository.description = description;

    const updatedRepository = await repository.save();

    res.json({
      message: "Repository updated successfully!",
      repository: updatedRepository,
    });
  } catch (err) {
    console.error("Error during updating repository : ", err.message);
    res.status(500).send("Server error");
  }
}

async function toggleVisibilityById(req, res) {
  const { id } = req.params;

  try {
    const repository = await Repository.findById(id);
    if (!repository) {
      return res.status(404).json({ error: "Repository not found!" });
    }

    repository.visibility = !repository.visibility;

    const updatedRepository = await repository.save();

    res.json({
      message: "Repository visibility toggled successfully!",
      repository: updatedRepository,
    });
  } catch (err) {
    console.error("Error during toggling visibility : ", err.message);
    res.status(500).send("Server error");
  }
}

const File = require("../models/File");

async function deleteRepositoryById(req, res) {

  const { id } = req.params;
  const { userId } = req.body;

  try {

    const repository = await Repository.findById(id);

    if (!repository) {
      return res.status(404).json({
        error: "Repository not found"
      });
    }

    if (repository.owner.toString() !== userId) {
      return res.status(403).json({
        error: "You are not allowed to delete this repository."
      });
    }

    await File.deleteMany({
      repo: id,
    });

    await Repository.findByIdAndDelete(id);

    await User.findByIdAndUpdate(userId, {
      $pull: {
        repositories: id,
      },
    });

    res.json({
      message: "Repository deleted successfully!"
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      error: err.message
    });

  }

}

module.exports = {
  createRepository,
  getAllRepositories,
  fetchRepositoryById,
  fetchRepositoryByName,
  fetchRepositoriesForCurrentUser,
  updateRepositoryById,
  toggleVisibilityById,
  deleteRepositoryById,
};
