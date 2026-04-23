import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

interface SkillInfo {
  id: string;
  title: string;
  description: string;
}

function getSkillsDirectory(): string {
  return path.join(process.cwd(), "chat-config", "skills");
}

function scanSkillsDir(dir: string, baseDir: string = dir): SkillInfo[] {
  const skills: SkillInfo[] = [];

  if (!fs.existsSync(dir)) {
    return skills;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const skillDir = path.join(dir, entry.name);
      const skillMdPath = path.join(skillDir, "SKILL.md");

      if (fs.existsSync(skillMdPath)) {
        const content = fs.readFileSync(skillMdPath, "utf-8");
        const { data } = matter(content);

        skills.push({
          id: entry.name,
          title: typeof data.title === "string" && data.title ? data.title : entry.name,
          description: typeof data.description === "string" && data.description ? data.description : "",
        });
      } else {
        const subSkills = scanSkillsDir(skillDir, baseDir);
        skills.push(...subSkills);
      }
    }
  }

  return skills;
}

export async function GET() {
  try {
    const skillsDir = getSkillsDirectory();
    const skills = scanSkillsDir(skillsDir);

    return NextResponse.json({ skills });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list skills";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
