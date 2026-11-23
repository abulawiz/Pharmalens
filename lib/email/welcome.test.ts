import { describe, expect, it } from "vitest";
import { renderWelcomeEmail } from "@/lib/email/welcome";

describe("welcome email", () => {
  it("renders PharmaLens branding and a dashboard link in HTML and text", () => {
    const email = renderWelcomeEmail("https://pharmalens.test");

    expect(email.html).toContain("Welcome to PharmaLens");
    expect(email.html).toContain('href="https://pharmalens.test/dashboard"');
    expect(email.text).toContain("https://pharmalens.test/dashboard");
    expect(email.text).toContain("preliminary visual screening");
  });

  it("rejects non-web app origins", () => {
    expect(() => renderWelcomeEmail("javascript:alert(1)")).toThrow("HTTP app origin");
  });
});
