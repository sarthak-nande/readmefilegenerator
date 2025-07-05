import { execSync } from "child_process";
import fs from "fs/promises";
import { writeFileSync, readdirSync, statSync } from "fs";
import path from "path";
import os from "os";
import { randomUUID } from "crypto";

function readAllFilesRecursively(dir, ignore = ["node_modules", ".git"]) {
  const files = [];

  for (const file of readdirSync(dir)) {
    const fullPath = path.join(dir, file);
    const stat = statSync(fullPath);

    if (stat.isDirectory() && !ignore.includes(file)) {
      files.push(...readAllFilesRecursively(fullPath, ignore));
    } else if (stat.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

async function readRelevantFiles(projectPath) {
  const allFiles = readAllFilesRecursively(projectPath);
  const relevantExtensions = [".js", ".ts", ".json", ".xml", ".gradle", ".md"];
  const relevantFiles = allFiles.filter((file) =>
    relevantExtensions.includes(path.extname(file))
  );

  let combinedContent = "";
  for (const file of relevantFiles) {
    try {
      const content = await fs.readFile(file, "utf-8");
      combinedContent += `\n\n### ${path.relative(
        projectPath,
        file
      )}\n\`\`\`\n${content}\n\`\`\``;
    } catch {
      console.warn(`⚠️ Skipped unreadable file: ${file}`);
    }
  }

  return combinedContent;
}

export async function generateReadmeFromRepo(repoUrl) {
  const repoName = repoUrl.split("/").pop().replace(".git", "");
  const clonePath = path.join("./repos", repoName);

  try {
    await fs.rm(clonePath, { recursive: true, force: true });

    console.log(`📥 Cloning ${repoUrl}...`);
    execSync(`git clone ${repoUrl} ${clonePath}`, { stdio: "inherit" });

    const prompt = `
Generate a professional README for this project. Return the result as a JSON array of objects with the following structure:
[
  { id: string, type: 'heading' | 'paragraph' | 'list' | 'code', title?: string, content: string | string[], level?: number, language?: string }
]

Include the following sections:
- Project description
- Tech stack with shields.io badges
- Setup instructions
- How to run
- Folder structure (as a code block)
- License
`;

    console.log("📚 Reading project files...");
    const fileContext = await readRelevantFiles(clonePath);
    const fullPrompt = `${prompt}\n\nHere are the project files:\n${fileContext}`;

    const tempPromptPath = path.join(
      os.tmpdir(),
      `gemini_prompt_${randomUUID()}.txt`
    );
    writeFileSync(tempPromptPath, fullPrompt, "utf-8");

    console.log(`🤖 Generating README.json using Gemini...`);
    const output = execSync(`gemini < "${tempPromptPath}"`, {
      cwd: clonePath,
      encoding: "utf-8",
    });

    await fs.unlink(tempPromptPath);
    await fs.rm(clonePath, { recursive: true, force: true });

    // Extract first valid JSON array using regex
    const match = output.match(/\[\s*{[\s\S]*?}\s*\]/); // match from [ { ... } ]

    if (!match) {
      console.error("❌ Could not extract JSON array from Gemini output.");
      return null;
    }

    let jsonResult;
    try {
      jsonResult = JSON.parse(match[0]);
    } catch (err) {
      console.error("❌ Failed to parse extracted JSON:", err.message);
      return null;
    }


    console.log("✅ README content parsed as JSON.");
    return jsonResult;
  } catch (err) {
    console.error("❌ Error:", err.message);
    return null;
  }
}
