import jwt_decode from 'jwt-decode';

export type UserDetails = { username: string, msOid: string, email: string };

export const getUserDetails = (jwt: string): UserDetails => {
  const removedBearer = jwt.substring(7);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const decodedToken: any = jwt_decode(removedBearer);

  return {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    username: decodedToken.name,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    msOid: decodedToken.oid,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    email: decodedToken.email ?? decodedToken.preferred_username ?? decodedToken.upn,
  };
};