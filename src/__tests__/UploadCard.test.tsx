import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { UploadCard } from "../components/UploadCard";

const requestMock = vi.fn();

vi.mock("../api/client", () => ({
  createApiClient: () => ({
    request: requestMock,
    requestWithMeta: requestMock
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
    vi.stubEnv("VITE_UI_DEBUG", "false");
    if (!URL.createObjectURL) {
      URL.createObjectURL = () => "blob:mock";
    }
    if (!URL.revokeObjectURL) {
      URL.revokeObjectURL = () => {};
    }
  });

  afterAll(() => {
    vi.unstubAllEnvs();
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

  it("renders success message after JSON conversion", async () => {
    requestMock.mockResolvedValueOnce({ data: { status: "ok", flights: 3 }, contentType: "application/json" });

    render(<UploadCard />);

    const input = screen.getByLabelText(/choose file/i) as HTMLInputElement;
    const image = new File([new Uint8Array(200)], "roster.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [image] } });

    fireEvent.click(screen.getByRole("button", { name: /convert image/i }));

    expect(await screen.findByText(/conversion complete/i)).toBeInTheDocument();
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

  it("shows ICS download when calendar is returned", async () => {
    requestMock.mockResolvedValueOnce({ data: "BEGIN:VCALENDAR\nEND:VCALENDAR", contentType: "text/calendar" });

    render(<UploadCard />);

    const input = screen.getByLabelText(/choose file/i) as HTMLInputElement;
    const image = new File([new Uint8Array(200)], "roster.png", { type: "image/png" });
    fireEvent.change(input, { target: { files: [image] } });

    fireEvent.click(screen.getByRole("button", { name: /convert image/i }));

    expect(await screen.findByText(/ics output/i)).toBeInTheDocument();
    expect(await screen.findByRole("link", { name: /download roster\.ics/i })).toBeInTheDocument();
  });
});
