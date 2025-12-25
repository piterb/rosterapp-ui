import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../auth/AuthProvider";
import { Home } from "../pages/Home";

describe("Home", () => {
  it("renders login button", async () => {
    render(
      <AuthProvider>
        <MemoryRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <Home />
        </MemoryRouter>
      </AuthProvider>
    );
    expect(await screen.findByRole("button", { name: /login/i })).toBeInTheDocument();
  });
});
