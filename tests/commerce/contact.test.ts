import { test } from "node:test";
import assert from "node:assert/strict";
import {
  contactEmail,
  parseContact,
  sendContact,
} from "../../src/lib/contact-request";
import { POST } from "../../src/app/api/contact/route";
import { eventServices } from "../../src/lib/service-options";

const input = {
  name: "Client Test",
  email: "client@example.com",
  interest: "Cafea + apă",
  team: "11–30 persoane",
  requestId: "a3066321-dd43-4a40-8dce-55eeb154832c",
  company: "Test",
  phone: "",
  message: "Bună!",
};
test("contact validates choices, email and header injection", () => {
  assert.equal(parseContact(input).email, input.email);
  for (const change of [
    { email: "bad" },
    { email: "a@b.com\r\nBcc: victim@example.com" },
    { interest: "invalid" },
    { team: "invalid" },
    { requestId: "invalid" },
    { message: "x".repeat(3001) },
  ])
    assert.throws(() => parseContact({ ...input, ...change }));
});
test("email escapes HTML and replies to the customer", () => {
  const email = contactEmail(
    parseContact({ ...input, message: "<script>alert(1)</script> & hello" }),
  );
  assert.equal(email.reply_to, input.email);
  assert.ok(email.html.includes("&lt;script&gt;"));
  assert.ok(!email.html.includes("<script>"));
});
test("event formats are accepted and email describes guests instead of an office team", () => {
  for (const interest of Object.values(eventServices)) {
    const email = contactEmail(parseContact({ ...input, interest, message: "Data și localitatea evenimentului" }));
    assert.ok(email.subject.includes(interest));
    assert.ok(email.text.includes("Invitați: 11–30 persoane"));
    assert.ok(!email.text.includes("Echipă:"));
  }
});
test("provider configuration is server-side and identical retries share an idempotency key", async () => {
  process.env.RESEND_API_KEY = "unit-test-secret";
  process.env.RESEND_FROM_EMAIL = "Makeon <contact@example.com>";
  process.env.CONTACT_EMAIL_TO = "inbox@example.com";
  const requests: RequestInit[] = [];
  const fetcher = (async (_url: unknown, options: RequestInit) => {
    requests.push(options);
    return Response.json({ id: "test-id" });
  }) as typeof fetch;
  await sendContact(parseContact(input), fetcher);
  await sendContact(parseContact(input), fetcher);
  assert.equal(
    (requests[0].headers as Record<string, string>)["Idempotency-Key"],
    (requests[1].headers as Record<string, string>)["Idempotency-Key"],
  );
  const body = JSON.parse(requests[0].body as string);
  assert.deepEqual(body.to, ["inbox@example.com"]);
  assert.equal(body.reply_to, input.email);
  await assert.rejects(
    sendContact(parseContact(input), (async () =>
      Response.json(
        { message: "private provider info" },
        { status: 403 },
      )) as typeof fetch),
    (error) =>
      error instanceof Error &&
      !error.message.includes("private provider info"),
  );
  delete process.env.RESEND_API_KEY;
  await assert.rejects(sendContact(parseContact(input), fetcher), {
    status: 503,
  });
});
test("endpoint rejects foreign origins and honeypot without sending", async () => {
  const request = (body: unknown, origin: string) =>
    new Request("http://localhost:3000/api/contact", {
      method: "POST",
      headers: { origin, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  assert.equal(
    (await POST(request(input, "https://attacker.example"))).status,
    403,
  );
  assert.equal(
    (
      await POST(
        request({ ...input, website: "spam" }, "http://localhost:3000"),
      )
    ).status,
    400,
  );
  assert.equal(
    (await POST(request({ ...input, email: "bad" }, "http://localhost:3000")))
      .status,
    400,
  );
});
test("endpoint confirms only accepted emails and throttles repeated requests", async () => {
  const previousFetch = globalThis.fetch;
  process.env.RESEND_API_KEY = "unit-test-secret";
  let sent = 0;
  globalThis.fetch = (async () => {
    sent++;
    return Response.json({ id: "test-id" });
  }) as typeof fetch;
  try {
    for (let i = 0; i < 5; i++) {
      const response = await POST(
        new Request("http://localhost:3000/api/contact", {
          method: "POST",
          headers: {
            origin: "http://localhost:3000",
            "Content-Type": "application/json",
            "x-forwarded-for": "192.0.2.15",
          },
          body: JSON.stringify(input),
        }),
      );
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { ok: true });
    }
    const blocked = await POST(
      new Request("http://localhost:3000/api/contact", {
        method: "POST",
        headers: {
          origin: "http://localhost:3000",
          "Content-Type": "application/json",
          "x-forwarded-for": "192.0.2.15",
        },
        body: JSON.stringify(input),
      }),
    );
    assert.equal(blocked.status, 429);
    assert.equal(sent, 5);
  } finally {
    globalThis.fetch = previousFetch;
    delete process.env.RESEND_API_KEY;
  }
});
