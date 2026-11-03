import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { StoreCoupons } from "./StoreCoupons";
import { storeService } from "../../services/storeService";

vi.mock("../../services/storeService", () => ({
  storeService: {
    getCoupons: vi.fn(),
    createCoupon: vi.fn(),
    updateCoupon: vi.fn(),
    deleteCoupon: vi.fn(),
  },
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockCoupons = [
  {
    id: 1,
    code: "VERAO10",
    discount_type: "PERCENTAGE" as const,
    discount_value: 10,
    min_purchase_amount: 100,
    usage_limit: 50,
    used_count: 5,
    valid_until: "2026-12-31T23:59:59Z",
    is_active: true,
    created_at: "2026-10-01T12:00:00Z",
  },
];

describe("StoreCoupons", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renderiza o cabeçalho e carrega cupons", async () => {
    vi.mocked(storeService.getCoupons).mockResolvedValueOnce(mockCoupons);

    render(<StoreCoupons />);

    expect(screen.getByText("Cupons de Desconto da Loja")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("VERAO10")).toBeInTheDocument();
      expect(screen.getByText("10% OFF")).toBeInTheDocument();
      expect(screen.getByText("Ativo")).toBeInTheDocument();
    });
  });

  it("abre modal de criar cupom e valida campos", async () => {
    vi.mocked(storeService.getCoupons).mockResolvedValueOnce([]);
    const user = userEvent.setup();

    render(<StoreCoupons />);

    await waitFor(() => {
      expect(screen.getByText("Nenhum cupom ativo no momento")).toBeInTheDocument();
    });

    const createBtn = screen.getByRole("button", { name: /Criar Novo Cupom/i });
    await user.click(createBtn);

    expect(screen.getByText("Criar Novo Cupom de Loja")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/EX: VERAO15/i)).toBeInTheDocument();
  });

  it("permite pausar um cupom ativo", async () => {
    vi.mocked(storeService.getCoupons).mockResolvedValueOnce(mockCoupons);
    vi.mocked(storeService.updateCoupon).mockResolvedValueOnce({
      ...mockCoupons[0],
      is_active: false,
    });
    const user = userEvent.setup();

    render(<StoreCoupons />);

    await waitFor(() => {
      expect(screen.getByText("VERAO10")).toBeInTheDocument();
    });

    const pauseBtn = screen.getByRole("button", { name: "Pausar" });
    await user.click(pauseBtn);

    expect(storeService.updateCoupon).toHaveBeenCalledWith(1, { is_active: false });
  });
});
