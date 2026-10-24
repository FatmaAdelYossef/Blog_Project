
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
    try {
      const decoded = jwtDecode(token);
      if (!decoded || typeof decoded.exp !== 'number') {
        return true;
      }
      const currentTime = Date.now() / 1000;
      return decoded.exp < currentTime;
    } catch {
      return true;
    }
  }
};