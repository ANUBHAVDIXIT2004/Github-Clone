const Commit = require("../models/commitModel");

const createCommit = async (req,res)=>{

    try{

        const commit = await Commit.create({

            repo:req.body.repoId,

            author:req.body.userId,

            message:req.body.message,

            action:req.body.action,

            fileName:req.body.fileName

        });

        res.status(201).json(commit);

    }
    catch(err){

        res.status(500).json({
            message:err.message
        });

    }

};

const getCommits = async(req,res)=>{

    try{

        const commits = await Commit.find({

            repo:req.params.repoId

        })
        .populate("author","username")
        .sort({createdAt:-1});

        res.json(commits);

    }

    catch(err){

        res.status(500).json({
            message:err.message
        });

    }

};

module.exports={

    createCommit,

    getCommits

};