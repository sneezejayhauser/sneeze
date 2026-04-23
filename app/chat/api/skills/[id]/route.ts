import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function getSkillPath(id: string): string {
  return path.join(process.cwd(), "chat-config", "skills", id, "SKILL.md");
}

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const skillPath = getSkillPath(id);

    if (!fs.existsSync(skillPath)) {
      return NextResponse.json({ error: "Skill not found" }, { status: 404 });
    }

    const content = fs.readFileSync(skillPath, "utf-8");
    const { data, content: markdownContent } = matter(content);

    const skillData = {
      id,
      title: typeof data.title === "string" && data.title ? data.title : id,
      description: typeof data.description === "string" && data.description ? data.description : "",
      content: markdownContent,
    };

    return NextResponse.json(skillData);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to read skill";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
