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
  actions?: ModuleActionConfig[];
  group?: string;
};

export type TableColumnType =
  | "text"
  | "number"
  | "money"
  | "date"
  | "boolean"
  | "status"
  | "list"
  | "shortId";

export type TableColumn = {
  key: string;
  label: string;
  type?: TableColumnType;
  tone?: "primary" | "numeric" | "muted";
};

export type ModuleActionKind = "create" | "edit" | "delete" | "refresh" | "search" | "filter";

export type ModuleActionConfig = {
  kind: ModuleActionKind;
  label: string;
  tone?: "primary" | "secondary" | "danger";
};
