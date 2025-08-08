import CryptoJS from 'crypto-js';
import { createTransform } from 'redux-persist';

const secretKey = import.meta.env.VITE_APP_SECRET_KEY;

export const encryptTransform = createTransform(
  // Transformación cuando se guarda (inbound)
  (inboundState, key) => {
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(inboundState), secretKey).toString();
    return encrypted;
  },
  // Transformación cuando se rehidrata (outbound)
  (outboundState, key) => {
    try {
      const bytes = CryptoJS.AES.decrypt(outboundState, secretKey);
      const decrypted = JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
      return decrypted;
    } catch (e) {
      console.error('Error al desencriptar', e);
      return outboundState;
    }
  }
);
