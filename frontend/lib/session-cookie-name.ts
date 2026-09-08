/** Session cookie for every login (team and external client accounts). */
export const DM_SESSION_COOKIE_NAME = "dm_session";

/**
 * Short-lived cookie that lets an authorised internal user preview the client
 * portal as one client. It never replaces `dm_session`, so the previewing
 * user keeps their own session for the rest of the app.
 */
export const DM_CLIENT_PREVIEW_COOKIE_NAME = "dm_client_preview";
