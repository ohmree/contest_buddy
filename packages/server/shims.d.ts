import prisma from '@prisma/client';

declare module '@tinyhttp/app' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface AuthInfo {}
  export type User = Express.User;

  interface CookieSessionOptions {
    name?: string | undefined;
    keys?: string[] | import('keygrip') | undefined;
    secret?: string | undefined;
    maxAge?: number | undefined;
    expires?: Date | undefined;
    path?: string | undefined;
    domain?: string | undefined;
    sameSite?: 'strict' | 'lax' | 'none' | boolean | undefined;
    secure?: boolean | undefined;
    secureProxy?: boolean | undefined;
    httpOnly?: boolean | undefined;
    signed?: boolean | undefined;
    overwrite?: boolean | undefined;
  }

  interface CookieSessionObject {
    [propertyName: string]: any;

    isChanged?: boolean | undefined;
    isNew?: boolean | undefined;
    isPopulated?: boolean | undefined;
  }

  interface CookieSessionRequest {
    session?: CookieSessionObject | null | undefined;
    sessionOptions: CookieSessionOptions;
  }

  export interface Request extends CookieSessionRequest {
    authInfo?: AuthInfo | undefined;
    user?: User | undefined;

    // These declarations are merged into tinyhttp's Request type
    login(user: User, done: (error: any) => void): void;
    login(user: User, options: any, done: (error: any) => void): void;
    logIn(user: User, done: (error: any) => void): void;
    logIn(user: User, options: any, done: (error: any) => void): void;

    logout(): void;
    logOut(): void;

    isAuthenticated(): this is AuthenticatedRequest;
    isUnauthenticated(): this is UnauthenticatedRequest;
  }

  export interface AuthenticatedRequest extends Request {
    user: User;
  }

  export interface UnauthenticatedRequest extends Request {
    user?: undefined;
  }
}
declare global {
  namespace Express {
    export interface User extends prisma.User {}
  }
}
