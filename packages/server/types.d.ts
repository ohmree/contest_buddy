import {
  User as _User,
  Contest as _Contest,
  Server as _Server,
} from '@prisma/client';

export type User = _User;
export type Contest = _Contest;
export type Server = _Server;
export interface Types {
  user: User;
  contest: Contest;
  server: Server;
}
