import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { UploadCard } from "../components/UploadCard";

const requestMock = vi.fn();

vi.mock("../api/client", () => ({
  createApiClient: () => ({
    request: requestMock
  })
}));

vi.mock("../auth/AuthProvider", () => ({
  useAuth: () => ({
    getAccessToken: vi.fn().mockResolvedValue("token"),
    login: vi.fn(),
    isAuthenticated: true,
    isLoading: false
  })
}));

describe("UploadCard", () => {
  beforeAll(() => {
    if (!URL.createObjectURL) {
      URL.createObjectURL = () => "blob:mock";
    }
    if (!URL.revokeObjectURL) {
      URL.revokeObjectURL = () => {};
    }
  });

  beforeEach(() => {
    requestMock.mockReset();
  });

  it("rejects oversized images", async () => {
    render(<UploadCard />);

    const input = screen.getByLabelText(/choose file/i) as HTMLInputElement;
    const bigFile = new File([new Uint8Array(2 * 1024 * 1024)], "big.png", { type: "image/png" });

    fireEvent.change(input, { target: { files: [bigFile] } });

    expect(await screen.findByText(/file is too large/i)).toBeInTheDocument();
  });

  it("rejects pdf uploads", async () => {
    render(<UploadCard />);

    const input = screen.getByLabelText(/choose file/i) as HTMLInputElement;
    const pdfFile = new File([new Uint8Array(10)], "roster.pdf", { type: "application/pdf" });

    fireEvent.change(input, { target: { files: [pdfFile] } });

    expect(await screen.findByText(/pdf files are not supported/i)).toBeInTheDocument();
  });

  it("renders JSON output after successful conversion", async () => {
    requestMock.mockResolvedValueOnce({ status: "ok", flights: 3 });

    render(<UploadCard />);

    const input = screen.getByLabelText(/choose file/i) as HTMLInputElement;
    const image = new File([new Uint8Array(200)], "roster.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [image] } });

    fireEvent.click(screen.getByRole("button", { name: /convert image/i }));

    expect(await screen.findByText(/conversion complete/i)).toBeInTheDocument();
    expect(await screen.findByText(/\"status\": \"ok\"/i)).toBeInTheDocument();
  });

  it("shows API errors", async () => {
    requestMock.mockRejectedValueOnce({ status: 500, message: "Conversion failed" });

    render(<UploadCard />);

    const input = screen.getByLabelText(/choose file/i) as HTMLInputElement;
    const image = new File([new Uint8Array(200)], "roster.jpg", { type: "image/jpeg" });
    fireEvent.change(input, { target: { files: [image] } });

    fireEvent.click(screen.getByRole("button", { name: /convert image/i }));

    expect(await screen.findByText(/error 500/i)).toBeInTheDocument();
    expect(await screen.findByText(/conversion failed/i)).toBeInTheDocument();
  });
});
