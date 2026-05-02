import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Cockpit from "../pages/cockpit";

type Handler = (url: string, init: RequestInit | undefined) => unknown;

interface Route {
  method: string;
  match: RegExp;
  handler: Handler;
}

let routes: Route[] = [];
let restoreFetch = () => {};

function route(method: string, match: RegExp, handler: Handler) {
  routes.push({ method, match, handler });
}

function jsonResponse(body: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

function errorResponse(detail: string, status = 400): Response {
  return {
    ok: false,
    status,
    json: async () => ({ detail }),
  } as Response;
}

function isMockResponse(value: unknown): value is Response {
  return (
    typeof value === "object" &&
    value !== null &&
    "ok" in value &&
    "json" in value &&
    typeof (value as { json: unknown }).json === "function"
  );
}

beforeEach(() => {
  routes = [];
  const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = typeof input === "string" ? input : (input as Request).url;
    const method = (init?.method ?? "GET").toUpperCase();

    for (const registered of routes) {
      if (registered.method === method && registered.match.test(url)) {
        const body = registered.handler(url, init);
        return isMockResponse(body) ? body : jsonResponse(body);
      }
    }

    if (/\/cost$/.test(url)) {
      return jsonResponse({ mission_id: "m-default", total_cost_usd: 0 });
    }
    if (/\/results$/.test(url)) {
      return jsonResponse({ mission_id: "m-default", results: [], total_cost_usd: 0 });
    }
    if (/\/alerts$/.test(url)) {
      return jsonResponse({ mission_id: "m-default", alerts: [] });
    }

    return jsonResponse({});
  });
  restoreFetch = () => fetchSpy.mockRestore();
});

afterEach(() => {
  restoreFetch();
  vi.restoreAllMocks();
});

function hasCockpitPollIntervalBeenScheduled(
  setIntervalSpy: { mock: { calls: Array<[unknown, unknown?, ...unknown[]]> } },
): boolean {
  return setIntervalSpy.mock.calls.some((call) => call[1] === 3000);
}

describe("Cockpit brand picker", () => {
  it("defaults to VS / LX and renders the three operator brands", () => {
    render(<Cockpit />);

    expect(screen.getByText(/vampire sex \/ london x/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /vs \/ lx/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^fractal$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^ats$/i })).toBeInTheDocument();
  });

  it("does not show an approval queue before a mission is active", () => {
    render(<Cockpit />);

    expect(screen.queryByText(/^approval queue$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^gated queue$/i)).not.toBeInTheDocument();
  });
});

describe("Cockpit launch flows", () => {
  it("surfaces Batman tasks without opening an idle polling interval", async () => {
    const user = userEvent.setup();
    const setIntervalSpy = vi.spyOn(globalThis, "setInterval");

    route("POST", /\/missions$/, () => ({
      id: "m-bat-1",
      mode: "batman",
      state: "pending_approval",
      tasks: [
        {
          id: "t-1",
          description: "Approve release caption",
          tool: "text_generator",
          parameters: { platform: "instagram" },
          cost: 0.0123,
        },
      ],
    }));

    render(<Cockpit />);
    await user.type(screen.getByPlaceholderText(/enter mission objective/i), "Release week");
    await user.click(screen.getByRole("button", { name: /^launch$/i }));

    await waitFor(() => {
      expect(screen.getByText(/approve release caption/i)).toBeInTheDocument();
    });
    expect(screen.getByText("Approval Queue")).toBeInTheDocument();
    expect(screen.getByText(/waiting on you/i)).toBeInTheDocument();
    expect(hasCockpitPollIntervalBeenScheduled(setIntervalSpy)).toBe(false);
  });

  it("runs Jarvis immediately and never renders an approval queue", async () => {
    const user = userEvent.setup();
    let observabilityFetches = 0;
    const results = [
      {
        task_id: "t-jarvis",
        task_name: "Deploy landing page",
        status: "completed",
        cost_usd: 0.04,
      },
    ];

    route("POST", /\/missions$/, () => ({
      id: "m-jarvis",
      mode: "jarvis",
      state: "pending_approval",
    }));
    route("POST", /\/missions\/m-jarvis\/run$/, () => ({
      mission_id: "m-jarvis",
      mode: "jarvis",
      status: "completed",
      results,
      total_cost_usd: 0.04,
      cost_alerts: [],
    }));
    route("GET", /\/missions\/m-jarvis\/(cost|results|alerts)$/, () => {
      observabilityFetches += 1;
      return {};
    });

    render(<Cockpit />);
    await user.click(screen.getByRole("button", { name: /^fractal$/i }));
    await user.type(screen.getByPlaceholderText(/enter mission objective/i), "Ship site");
    await user.click(screen.getByRole("button", { name: /^launch$/i }));

    await waitFor(() => {
      expect(screen.getByText(/deploy landing page/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/^approval queue$/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^gated queue$/i)).not.toBeInTheDocument();
    expect(observabilityFetches).toBe(0);
  });

  it("surfaces Wakanda gated tasks beside pass-through results", async () => {
    const user = userEvent.setup();
    let observabilityFetches = 0;
    const passThroughResults = [
      {
        task_id: "t-internal",
        task_name: "Internal A&R notes",
        status: "completed",
        cost_usd: 0.01,
      },
    ];

    route("POST", /\/missions$/, () => ({
      id: "m-wakanda",
      mode: "wakanda",
      state: "pending_approval",
    }));
    route("POST", /\/missions\/m-wakanda\/run-wakanda$/, () => ({
      mission_id: "m-wakanda",
      mode: "wakanda",
      tasks: [
        { id: "t-internal", description: "Internal A&R notes" },
        { id: "t-public", description: "Announce release on IG" },
      ],
      gated_task_ids: ["t-public"],
      pass_through_results: passThroughResults,
      total_cost_usd: 0.01,
    }));
    route("GET", /\/missions\/m-wakanda\/(cost|results|alerts)$/, () => {
      observabilityFetches += 1;
      return {};
    });

    render(<Cockpit />);
    await user.click(screen.getByRole("button", { name: /^ats$/i }));
    await user.type(screen.getByPlaceholderText(/enter mission objective/i), "Release week");
    await user.click(screen.getByRole("button", { name: /^launch$/i }));

    await waitFor(() => {
      expect(screen.getByText("Gated Queue")).toBeInTheDocument();
    });
    expect(screen.getByText(/announce release on ig/i)).toBeInTheDocument();
    expect(screen.getByText(/internal a&r notes/i)).toBeInTheDocument();
    expect(observabilityFetches).toBe(0);
  });

  it("surfaces submit errors from mission creation", async () => {
    const user = userEvent.setup();

    route("POST", /\/missions$/, () => errorResponse("Decomposition failed", 502));

    render(<Cockpit />);
    await user.type(screen.getByPlaceholderText(/enter mission objective/i), "Anything");
    await user.click(screen.getByRole("button", { name: /^launch$/i }));

    await waitFor(() => {
      expect(screen.getByText(/decomposition failed/i)).toBeInTheDocument();
    });
  });
});

describe("Cockpit approval flows", () => {
  it("executes Batman only after the final approval and marks completed runs done", async () => {
    const user = userEvent.setup();
    const setIntervalSpy = vi.spyOn(globalThis, "setInterval");
    const completedResults = [
      {
        task_id: "t-2",
        task_name: "Second",
        status: "completed",
        cost_usd: 0.02,
      },
    ];
    const approvals: string[] = [];
    let executeCalls = 0;
    let observabilityFetches = 0;

    route("POST", /\/missions$/, () => ({
      id: "m-bat-2",
      mode: "batman",
      state: "pending_approval",
      tasks: [
        { id: "t-1", description: "First" },
        { id: "t-2", description: "Second" },
      ],
    }));
    route("POST", /\/missions\/m-bat-2\/tasks\/.+\/approve$/, url => {
      approvals.push(url);
      return {};
    });
    route("POST", /\/missions\/m-bat-2\/execute$/, () => {
      executeCalls += 1;
      return {
        mission_id: "m-bat-2",
        status: "completed",
        executed_count: 1,
        review_blocked_count: 0,
        results: completedResults,
        total_cost_usd: 0.02,
        cost_alerts: [],
      };
    });
    route("GET", /\/missions\/m-bat-2\/(cost|results|alerts)$/, () => {
      observabilityFetches += 1;
      return {};
    });

    render(<Cockpit />);
    await user.type(screen.getByPlaceholderText(/enter mission objective/i), "Run Batman");
    await user.click(screen.getByRole("button", { name: /^launch$/i }));

    await waitFor(() => {
      expect(screen.getByText("First")).toBeInTheDocument();
      expect(screen.getByText("Second")).toBeInTheDocument();
    });

    await user.click(screen.getAllByRole("button", { name: /^approve$/i })[0]);
    await waitFor(() => expect(approvals).toHaveLength(1));
    expect(executeCalls).toBe(0);

    await user.click(screen.getByRole("button", { name: /^approve$/i }));

    await waitFor(() => {
      expect(executeCalls).toBe(1);
      expect(screen.getByText(/^done$/i)).toBeInTheDocument();
    });
    expect(hasCockpitPollIntervalBeenScheduled(setIntervalSpy)).toBe(false);
    expect(observabilityFetches).toBe(0);
  });

  it("uses Wakanda approval endpoint and completes when the gated queue empties", async () => {
    const user = userEvent.setup();
    let wakandaApprovalCalls = 0;
    let batmanExecuteCalls = 0;
    let observabilityFetches = 0;

    route("POST", /\/missions$/, () => ({
      id: "m-wak-approve",
      mode: "wakanda",
      state: "pending_approval",
    }));
    route("POST", /\/missions\/m-wak-approve\/run-wakanda$/, () => ({
      mission_id: "m-wak-approve",
      mode: "wakanda",
      tasks: [{ id: "t-gated", description: "Public announcement" }],
      gated_task_ids: ["t-gated"],
      pass_through_results: [],
      total_cost_usd: 0,
    }));
    route("POST", /\/missions\/m-wak-approve\/wakanda\/tasks\/t-gated\/approve$/, () => {
      wakandaApprovalCalls += 1;
      return {
        task_id: "t-gated",
        task_name: "Public announcement",
        status: "completed",
        cost_usd: 0.01,
      };
    });
    route("POST", /\/missions\/m-wak-approve\/execute$/, () => {
      batmanExecuteCalls += 1;
      return {};
    });
    route("GET", /\/missions\/m-wak-approve\/(cost|results|alerts)$/, () => {
      observabilityFetches += 1;
      return {};
    });

    render(<Cockpit />);
    await user.click(screen.getByRole("button", { name: /^ats$/i }));
    await user.type(screen.getByPlaceholderText(/enter mission objective/i), "ATS post");
    await user.click(screen.getByRole("button", { name: /^launch$/i }));

    await waitFor(() => {
      expect(screen.getByText(/public announcement/i)).toBeInTheDocument();
    });
    await user.click(screen.getByRole("button", { name: /^approve$/i }));

    await waitFor(() => {
      expect(wakandaApprovalCalls).toBe(1);
      expect(screen.getByText(/^done$/i)).toBeInTheDocument();
    });
    expect(batmanExecuteCalls).toBe(0);
    expect(observabilityFetches).toBe(0);
  });
});
