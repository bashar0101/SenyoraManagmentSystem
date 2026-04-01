import { v4 as uuidv4 } from 'uuid';

let currentToken = uuidv4();

export const getToken = () => currentToken;

export const rotateToken = () => {
  currentToken = uuidv4();
};

export const validateAndRotate = (token) => {
  if (token !== currentToken) return false;
  rotateToken();
  return true;
};
