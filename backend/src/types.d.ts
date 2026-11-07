import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId: string;
    oauthState?: string;
    oauthFrom?: string;
    oauthLinkUserId?: string;
    adminOauthState?: string;
    adminAuthenticated?: boolean;
  }
}
