import { generateReadmeFromRepo } from "../middleware/generate.js";

async function generatedReadme(req,res) {
    try {
        const repoUrl = req.body.link;
        if (!repoUrl) return res.status(400).send('Missing repoUrl');
    
        const readme = await generateReadmeFromRepo(repoUrl);
        if (!readme) return res.status(500).send('Failed to generate README');

        res.status(200).type('text/markdown').send(readme);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({"message" : "Failed To Generate README.md File"});
    }
}

export {generatedReadme};