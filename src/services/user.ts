import jwt_decode from 'jwt-decode';
import { AuthorisationJwtBearerToken } from '../models/user';
import { ERRORS } from '../util/enum';

export type UserDetails = { username: string, msOid: string, email: string };

export const getUserDetails = (jwt: string): UserDetails => {
  const removedBearer = jwt.substring(7);
  const decodedToken: AuthorisationJwtBearerToken = jwt_decode(removedBearer);
  const userDetails = {
    username: decodedToken.name,
    msOid: decodedToken.oid,
    email: decodedToken.email ?? decodedToken.preferred_username ?? decodedToken.upn,
  };
  if (!userDetails?.username || !userDetails.msOid) {
    throw new Error(ERRORS.MISSING_USER_DETAILS);
  }
  return userDetails;
};
