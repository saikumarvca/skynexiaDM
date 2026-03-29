export type ConnectWallChannel = {
  id: string
  name: string
  description: string
}

/** Fixed org channels — IDs are stored on messages and validated by the API. */
export const CONNECT_WALL_CHANNELS: ConnectWallChannel[] = [
  { id: "general", name: "general", description: "Company-wide chatter and quick questions" },
  { id: "announcements", name: "announcements", description: "Leadership updates and news" },
  { id: "projects", name: "projects", description: "Campaigns, deliverables, and blockers" },
  { id: "random", name: "random", description: "Non-work banter" },
]

const CHANNEL_IDS = new Set(CONNECT_WALL_CHANNELS.map((c) => c.id))

export function isConnectWallChannelId(id: string): boolean {
  return CHANNEL_IDS.has(id)
}
