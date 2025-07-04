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

    const prompt = `Generate a professional README.md for this project. Include:
- Project description
- Tech stack with icons
- Setup instructions
- How to run
- Folder structure
- License section
- Fancy icons for all tech stacks
- Make the README.md file look attractive and professional`;

    console.log("📚 Reading project files...");
    const fileContext = await readRelevantFiles(clonePath);
    const fullPrompt = `${prompt}\n\nHere are the project files:\n${fileContext}`;

    const tempPromptPath = path.join(
      os.tmpdir(),
      `gemini_prompt_${randomUUID()}.txt`
    );
    writeFileSync(tempPromptPath, fullPrompt, "utf-8");

    console.log(`🤖 Generating README.md using Gemini...`);
    const output = execSync(`gemini < "${tempPromptPath}"`, {
      cwd: clonePath,
      encoding: "utf-8",
    });

    const readmePath = path.join(clonePath, "README.md");
    await fs.writeFile(readmePath, output);

    await fs.unlink(tempPromptPath);

    await fs.rm(clonePath, { recursive: true, force: true });
    console.log("✅ README.md generated successfully.");
    return output;
  } catch (err) {
    console.error("❌ Error:", err.message);
    return null;
  }
}
