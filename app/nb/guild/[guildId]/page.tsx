import { GuildSettingsEditor } from "@/components/nb/GuildSettingsEditor";

export default async function GuildPage({ params }: { params: Promise<{ guildId: string }> }) {
  const { guildId } = await params;
  return <GuildSettingsEditor guildId={guildId} />;
}
