
import { jwtDecode } from 'jwt-decode';

export const jwtService = {
  decodeToken: (token) => {
    try {
      return jwtDecode(token);
    } catch (e) {
      return null;
    }
  },

  isTokenExpired: (token) => {
    const decoded = jwtDecode(token);
    const currentTime = Date.now() / 1000;
    return decoded.exp < currentTime;
  }
};