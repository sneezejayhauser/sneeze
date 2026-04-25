export interface Attachment {
  id: string;
  dataUrl: string;
  name: string;
  type: string;
}

export interface Message {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  attachments?: Attachment[];
}

interface ContentPart {
  type: string;
  [key: string]: unknown;
}

export function buildMessages(messages: Message[]): Array<{
  role: string;
  content: string | ContentPart[];
}> {
  return messages.map((msg) => {
    if (msg.role === "system") {
      return { role: "system", content: msg.content };
    }

    if (msg.role === "tool") {
      return { role: "tool", content: msg.content };
    }

    if (!msg.attachments || msg.attachments.length === 0) {
      return { role: msg.role, content: msg.content };
    }

    const parts: ContentPart[] = [
      { type: "text", text: msg.content || " " },
    ];

    for (const att of msg.attachments) {
      parts.push({
        type: "image_url",
        image_url: { url: att.dataUrl },
      });
    }

    return { role: msg.role, content: parts };
  });
}

export function buildSystemPrompt(
  defaultPrompt: string,
  userPrompt?: string,
  availableSkillIds?: string[]
): string {
  const parts = [];
  if (defaultPrompt) parts.push(defaultPrompt);
  if (userPrompt) parts.push(userPrompt);

  let combined = parts.join("\n\n");

  if (availableSkillIds && availableSkillIds.length > 0) {
    const skillsAppendix =
      "\n\nAvailable skills:\n" + availableSkillIds.map((id) => `- ${id}`).join("\n");
    combined += skillsAppendix;
  }

  return combined;
}
