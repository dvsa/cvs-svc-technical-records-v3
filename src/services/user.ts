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
    // Data remediation requirements...
    // If we have an authenticated token, but it is not running in the context of a user
    // then it will be a client_credentials grant_type e.g. the data remediation app.
    // In this scenario, this is a valid path, but the request is not running in the context of a user,
    // so we don't have a username or email available in the token.
    // To accommodate this, we can set an environment variable that allows for the username and email
    // to be set to SYSTEM_USER.

    // TODO: Can we replace this with custom claims in the Entra app registration. This way we can define
    //       'client' (data remediation app) contact details for use here.
    // TODO: The token dependency here should be refactored into the authorizer context object.
    if (process.env.ENABLE_SYSTEM_USER_IMPERSONATION === "true") {
      userDetails.username = 'SYSTEM_USER';
      userDetails.email = 'SYSTEM_USER';
      return userDetails;
    }

    throw new Error(ERRORS.MISSING_USER_DETAILS);
  }
  return userDetails;
};
