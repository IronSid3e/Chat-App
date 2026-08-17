import { ensureDirectMessage } from "../dm";

jest.mock("expo-crypto", () => ({ randomUUID: () => "new-channel-123" }));
jest.mock("@supabase/supabase-js", () => ({}));

type LogEntry = [table: string, method: string, args: any[]];

function createClient(results: any[]) {
  const counter = { i: 0 };
  const log: LogEntry[] = [];
  const builder: any = {};

  const chain = (method: string) =>
    jest.fn(function (...args: any[]) {
      log.push([builder._table, method, args]);
      return builder;
    });

  [
    "select",
    "eq",
    "in",
    "limit",
    "maybeSingle",
    "single",
    "insert",
    "order",
  ].forEach((m) => (builder[m] = chain(m)));

  builder.then = (resolve: (v: any) => void) => resolve(results[counter.i++]);

  const from = jest.fn((table: string) => {
    builder._table = table;
    return builder;
  });

  return { from, log };
}

const USER_WITH_FULL_NAME = {
  id: "user-2",
  first_name: "Ali",
  last_name: "Veli",
  full_name: "Ali Usta",
  avatar_url: null,
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
};

const USER_NO_FULL_NAME = {
  id: "user-2",
  first_name: "Ali",
  last_name: "Veli",
  full_name: "",
  avatar_url: null,
  created_at: "2024-01-01T00:00:00.000Z",
  updated_at: "2024-01-01T00:00:00.000Z",
};

describe("ensureDirectMessage", () => {
  it("creates channel + 2 members when no memberships exist", async () => {
    const client = createClient([
      { data: [], error: null },
      { data: null, error: null },
      { data: null, error: null },
      { data: null, error: null },
    ]) as any;

    const id = await ensureDirectMessage(client, "user-1", USER_NO_FULL_NAME);

    expect(id).toBe("new-channel-123");
    const tables = client.from.mock.calls.map((c: any[]) => c[0]);
    expect(tables).toEqual([
      "channel_members",
      "channels",
      "channel_members",
      "channel_members",
    ]);

    const inserts = client.log.filter((e: LogEntry) => e[1] === "insert");
    expect(inserts[0][2][0]).toEqual({
      id: "new-channel-123",
      name: "Ali Veli",
      is_direct_message: true,
      avatar_url: null,
    });
    expect(inserts[1][2][0]).toEqual({
      channel_id: "new-channel-123",
      user_id: "user-1",
    });
    expect(inserts[2][2][0]).toEqual({
      channel_id: "new-channel-123",
      user_id: "user-2",
    });
  });

  it("returns existing shared DM without inserting", async () => {
    const client = createClient([
      { data: [{ channel_id: "c1" }], error: null },
      { data: [{ channel_id: "c1" }], error: null },
      { data: { id: "c1" }, error: null },
    ]) as any;

    const id = await ensureDirectMessage(client, "user-1", USER_WITH_FULL_NAME);

    expect(id).toBe("c1");
    const inserts = client.log.filter((e: LogEntry) => e[1] === "insert");
    expect(inserts).toHaveLength(0);
  });

  it("creates a new DM when shared channel is not a DM", async () => {
    const client = createClient([
      { data: [{ channel_id: "c1" }], error: null },
      { data: [{ channel_id: "c1" }], error: null },
      { data: null, error: null },
      { data: null, error: null },
      { data: null, error: null },
      { data: null, error: null },
    ]) as any;

    const id = await ensureDirectMessage(client, "user-1", USER_WITH_FULL_NAME);

    expect(id).toBe("new-channel-123");
    const inserts = client.log.filter((e: LogEntry) => e[1] === "insert");
    expect(inserts[0][0]).toBe("channels");
    expect(inserts[0][2][0]).toMatchObject({ name: "Ali Usta" });
  });

  it("falls back to first + last name when full_name is empty", async () => {
    const client = createClient([
      { data: [], error: null },
      { data: null, error: null },
      { data: null, error: null },
      { data: null, error: null },
    ]) as any;

    await ensureDirectMessage(client, "user-1", USER_NO_FULL_NAME);

    const inserts = client.log.filter((e: LogEntry) => e[1] === "insert");
    expect(inserts[0][2][0]).toMatchObject({ name: "Ali Veli" });
  });

  it("throws when channel insert fails", async () => {
    const client = createClient([
      { data: [], error: null },
      { data: null, error: { message: "insert failed" } },
    ]) as any;

    await expect(
      ensureDirectMessage(client, "user-1", USER_NO_FULL_NAME),
    ).rejects.toMatchObject({ message: "insert failed" });
  });
});
