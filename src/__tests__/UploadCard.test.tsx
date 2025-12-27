import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "../auth/AuthProvider";
import { UploadCard } from "../components/UploadCard";

describe("UploadCard", () => {
  it("rejects oversized images", async () => {
    render(
      <AuthProvider>
        <MemoryRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <UploadCard />
        </MemoryRouter>
      </AuthProvider>
    );

    const input = screen.getByLabelText(/choose file/i) as HTMLInputElement;
    const bigFile = new File([new Uint8Array(2 * 1024 * 1024)], "big.png", { type: "image/png" });

    fireEvent.change(input, { target: { files: [bigFile] } });

    expect(await screen.findByText(/file is too large/i)).toBeInTheDocument();
  });

  it("rejects pdf uploads", async () => {
    render(
      <AuthProvider>
        <MemoryRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <UploadCard />
        </MemoryRouter>
      </AuthProvider>
    );

    const input = screen.getByLabelText(/choose file/i) as HTMLInputElement;
    const pdfFile = new File([new Uint8Array(10)], "roster.pdf", { type: "application/pdf" });

    fireEvent.change(input, { target: { files: [pdfFile] } });

    expect(await screen.findByText(/pdf files are not supported/i)).toBeInTheDocument();
  });
});
