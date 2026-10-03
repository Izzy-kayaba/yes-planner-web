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
  | "notes";

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = LoginInput & {
  phoneNumber: string;
  firstName: string;
  lastName: string;
  role: "Couple" | "Planner" | "Vendor";
};

export type AuthSession = {
  userId?: string;
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
