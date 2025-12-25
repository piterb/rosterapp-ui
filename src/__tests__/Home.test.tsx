import { render, screen } from "@testing-library/react";
import { App } from "../App";

describe("Home", () => {
  it("renders login button", async () => {
    render(<App />);
    expect(await screen.findByRole("button", { name: /login/i })).toBeInTheDocument();
  });
});
