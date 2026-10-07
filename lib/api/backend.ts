import { apiRequest } from "@/lib/api/client";
import { authClient } from "@/lib/auth-client";
import type {
  AuthSession,
  BackendAdapter,
  EntityId,
  LoginInput,
  PaginatedResult,
  RegisterInput,
  WorkspaceModule,
} from "@/lib/api/contracts";

const dataSource = process.env.NEXT_PUBLIC_DATA_SOURCE ?? "api";

function workspaceStorageKey(weddingId: string, module: WorkspaceModule) {
  // Separate both weddings and workspace modules so preview data never mixes between them.
  return `yes-planner:${weddingId}:${module}`;
}

function readStored<T>(key: string, seed: T[]) {
  const stored = window.localStorage.getItem(key);
  if (!stored) {
    // A first visit starts from the demo data; later visits use the saved copy.
    window.localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  }
  try {
    return JSON.parse(stored) as T[];
  } catch {
    // Ignore invalid old preview data and restore a usable starting list.
    window.localStorage.setItem(key, JSON.stringify(seed));
    return seed;
  }
}

function writeStored<T>(key: string, values: T[]) {
  window.localStorage.setItem(key, JSON.stringify(values));
}

function paged<T>(values: T[], page: number, pageSize: number): PaginatedResult<T> {
  // Keep browser-preview lists compatible with the server's pagination response.
  const totalItems = values.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  // Use the same one-based page calculation as the API-backed workspace.
  return {
    items: values.slice((page - 1) * pageSize, page * pageSize),
    pagination: {
      page,
      pageSize,
      totalItems,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1 && totalPages > 0,
    },
  };
}

const demoBackend: BackendAdapter = {
  async login() {
    return {};
  },
  async register() {
    return {};
  },
  async list(weddingId, module, seed, page, pageSize) {
    return paged(readStored(workspaceStorageKey(weddingId, module), seed), page, pageSize);
  },
  async create<T extends { id: EntityId }>(
    weddingId: string,
    module: WorkspaceModule,
    value: Omit<T, "id">,
  ) {
    const key = workspaceStorageKey(weddingId, module);
    const values = readStored<T>(key, []);
    const created = { ...value, id: crypto.randomUUID() } as T;
    // Append instead of replacing the list so other saved preview records survive.
    writeStored(key, [...values, created]);
    return created;
  },
  async update<T extends { id: EntityId }>(weddingId: string, module: WorkspaceModule, value: T) {
    const key = workspaceStorageKey(weddingId, module);
    const values = readStored<T>(key, []);
    writeStored(
      key,
      // Replace only the matching record; all other records remain unchanged.
      values.map((item) => (String(item.id) === String(value.id) ? value : item)),
    );
    return value;
  },
  async remove(weddingId, module, id) {
    const key = workspaceStorageKey(weddingId, module);
    const values = readStored<Array<{ id: EntityId }>[number]>(key, []);
    writeStored(
      key,
      // Filter out the requested ID while keeping every other record.
      values.filter((item) => String(item.id) !== String(id)),
    );
  },
};

const httpBackend: BackendAdapter = {
  async login(input) {
    const result = await authClient.signIn.email(input);
    // Better Auth reports expected sign-in failures in `error`, not as thrown exceptions.
    if (result.error) throw new Error(result.error.message ?? "Authentication failed.");
    return { userId: result.data?.user.id };
  },
  async register(input) {
    await apiRequest("/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
    // Registration creates the account first; read the new session to return its identity.
    const session = await authClient.getSession();
    return { userId: session.data?.user.id };
  },
  list(weddingId, module, _seed, page, pageSize) {
    // The server owns persisted records; only pagination settings are needed for this request.
    const query = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    return apiRequest(`/api/v1/weddings/${weddingId}/workspace/${module}?${query}`);
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
  // Keep screens independent of storage choice; configuration selects preview or persisted data.
  return dataSource === "api" ? httpBackend : demoBackend;
}
