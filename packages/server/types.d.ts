import {User as _User, Contest as _Contest} from '@prisma/client';

export type User = _User;
export type Contest = _Contest;
export interface Types {
  user: User;
  contest: Contest;
}
