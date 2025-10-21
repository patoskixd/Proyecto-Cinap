export type TeacherId = string;

export type Teacher = {
  id: TeacherId;
  name: string;
  email: string;
};

export type TeacherPage = {
  items: Teacher[];
  page: number;
  perPage: number;
  total: number;
  pages: number;
};
