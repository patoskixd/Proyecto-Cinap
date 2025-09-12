export type UserDto = {
  id: string;
  email: string;
  name: string;
  role: string; 
};

export type MeResponse =
  | { authenticated: false }
  | { authenticated: true; user: UserDto };
