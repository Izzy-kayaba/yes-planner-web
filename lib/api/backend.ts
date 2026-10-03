import { apiRequest } from "@/lib/api/client";
import { authClient } from "@/lib/auth-client";
import type {
  AuthSession,
  BackendAdapter,
  EntityId,
  LoginInput,
  RegisterInput,
  WorkspaceModule,
} from "@/lib/api/contracts";

const dataSource = process.env.NEXT_PUBLIC_DATA_SOURCE ?? "api";

function workspaceStorageKey(weddingId: string, module: WorkspaceModule) {
  return `vow-planner:${weddingId}:${module}`;
}

function readStored<T>(key: string, seed: T[]) {
  const stored = window.localStorage.getItem(key);
  if (!stored) {
    window.localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  }
  try {
    return JSON.parse(stored) as T[];
  } catch {
    window.localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  }
}

function writeStored<T>(key: string, values: T[]) {
  window.localStorage.setItem(key, JSON.stringify(values));
}

const demoBackend: BackendAdapter = {
  async login() {
    return {};
  },
  async register() {
    return {};
  },
  async list(weddingId, module, seed) {
    return readStored(workspaceStorageKey(weddingId, module), seed);
  },
  async create<T extends { id: EntityId }>(
    weddingId: string,
    module: WorkspaceModule,
    value: Omit<T, "id">,
  ) {
    const key = workspaceStorageKey(weddingId, module);
    const values = readStored<T>(key, []);
    const created = { ...value, id: crypto.randomUUID() } as T;
    writeStored(key, [...values, created]);
    return created;
  },
  async update<T extends { id: EntityId }>(weddingId: string, module: WorkspaceModule, value: T) {
    const key = workspaceStorageKey(weddingId, module);
    const values = readStored<T>(key, []);
    writeStored(
      key,
      values.map((item) => (String(item.id) === String(value.id) ? value : item)),
    );
    return value;
  },
  async remove(weddingId, module, id) {
    const key = workspaceStorageKey(weddingId, module);
    const values = readStored<Array<{ id: EntityId }>[number]>(key, []);
    writeStored(
      key,
      values.filter((item) => String(item.id) !== String(id)),
    );
  },
};

const httpBackend: BackendAdapter = {
  async login(input) {
    const result = await authClient.signIn.email(input);
    if (result.error) throw new Error(result.error.message ?? "Authentication failed.");
    return { userId: result.data?.user.id };
  },
  async register(input) {
    await apiRequest("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
    const session = await authClient.getSession();
    return { userId: session.data?.user.id };
  },
  list(weddingId, module) {
    return apiRequest(`/api/v1/weddings/${weddingId}/workspace/${module}`);
  },
  create(weddingId, module, value) {
    return apiRequest(`/api/v1/weddings/${weddingId}/workspace/${module}`, {
      method: "POST",
      body: JSON.stringify(value),
    });
  },
  update(weddingId, module, value) {
    return apiRequest(`/api/v1/weddings/${weddingId}/workspace/${module}/${value.id}`, {
      method: "PUT",
      body: JSON.stringify(value),
    });
  },
  remove(weddingId, module, id) {
    return apiRequest(`/api/v1/weddings/${weddingId}/workspace/${module}/${id}`, {
      method: "DELETE",
    });
  },
};

export function getBackend(): BackendAdapter {
  return dataSource === "api" ? httpBackend : demoBackend;
}
