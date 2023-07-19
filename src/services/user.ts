import jwt_decode from 'jwt-decode';
import { AuthorisationJwtBearerToken } from '../models/user';

export type UserDetails = { username: string, msOid: string, email: string };

export const getUserDetails = (jwt: string): UserDetails => {
  const removedBearer = jwt.substring(7);
  const decodedToken: AuthorisationJwtBearerToken = jwt_decode(removedBearer);
  return {
    username: decodedToken.name,
    msOid: decodedToken.oid,
    email: decodedToken.email ?? decodedToken.preferred_username ?? decodedToken.upn,
  };
};
