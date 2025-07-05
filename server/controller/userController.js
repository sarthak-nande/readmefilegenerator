import { generateReadmeFromRepo } from "../middleware/generate.js";

async function generatedReadme(req, res) {
  try {
    const repoUrl = req.body.link;
    if (!repoUrl) return res.status(400).json({ message: "Missing repoUrl" });

    const readmeJson = await generateReadmeFromRepo(repoUrl);
    if (!readmeJson) {
      return res.status(500).json({ message: "Failed to generate README" });
    }

    res.status(200).json({
      success: true,
      data: readmeJson
    });
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ message: "Failed To Generate README.md File" });
  }
}

export { generatedReadme };
