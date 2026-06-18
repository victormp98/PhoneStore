export type ApiObject = Record<string, unknown>;

export type LoginResponse = {
  accessToken: string;
  refreshToken?: string;
  id?: string;
  name?: string;
  email?: string;
  roleNames?: string[];
};

export type CurrentUser = {
  id?: string;
  name?: string;
  email?: string;
  roles?: string[];
};

export type ModuleConfig = {
  key: string;
  label: string;
  endpoint: string;
  description: string;
};

export type TableColumnType =
  | "text"
  | "money"
  | "date"
  | "boolean"
  | "status"
  | "shortId";

export type TableColumn = {
  key: string;
  label: string;
  type?: TableColumnType;
};
