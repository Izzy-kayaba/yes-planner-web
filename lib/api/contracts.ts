export type EntityId = string | number;

export type WorkspaceModule =
  | "guests"
  | "budget"
  | "tasks"
  | "vendors"
  | "timeline"
  | "seating"
  | "food-drinks"
  | "documents"
  | "bookings"
  | "payments"
  | "messages"
  | "notes";

export type LoginInput = {
  phoneNumber: string;
  password: string;
};

export type RegisterInput = LoginInput & {
  email?: string;
  firstName?: string;
  lastName?: string;
  role: "Couple" | "Planner" | "Vendor";
};

export type AuthSession = {
  token: string;
};

export interface BackendAdapter {
  login(input: LoginInput): Promise<AuthSession>;
  register(input: RegisterInput): Promise<AuthSession>;
  list<T>(weddingId: string, module: WorkspaceModule, seed: T[]): Promise<T[]>;
  create<T extends { id: EntityId }>(
    weddingId: string,
    module: WorkspaceModule,
    value: Omit<T, "id">,
  ): Promise<T>;
  update<T extends { id: EntityId }>(
    weddingId: string,
    module: WorkspaceModule,
    value: T,
  ): Promise<T>;
  remove(weddingId: string, module: WorkspaceModule, id: EntityId): Promise<void>;
}
