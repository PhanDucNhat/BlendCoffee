export interface UserInfo {
  id: number;
  username: string;
  role: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: UserInfo;
}

export interface SignupResponse {
  message: string;
}