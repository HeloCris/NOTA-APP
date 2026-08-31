import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import {
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { LoginForm } from "./LoginForm";

const mockLogin = vi.fn();

vi.mock("../../contexts/useAuth", () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

function renderLoginForm() {
  return render(
    <MemoryRouter>
      <LoginForm />
    </MemoryRouter>,
  );
}

describe("LoginForm", () => {
  beforeEach(() => {
    mockLogin.mockReset();
    localStorage.clear();
  });

  it("renderiza campos de e-mail e senha", () => {
    renderLoginForm();

    expect(
      screen.getByLabelText(/^e-mail$/i),
    ).toBeInTheDocument();

    expect(
      screen.getByLabelText(/^senha$/i),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: /acessar nōta/i,
      }),
    ).toBeInTheDocument();
  });

  it("exibe validações ao submeter campos vazios", async () => {
    const user = userEvent.setup();

    renderLoginForm();

    await user.click(
      screen.getByRole("button", {
        name: /acessar nōta/i,
      }),
    );

    expect(
      await screen.findByText(
        "Informe seu e-mail.",
      ),
    ).toBeInTheDocument();

    expect(
      await screen.findByText(
        "Informe sua senha.",
      ),
    ).toBeInTheDocument();

    expect(mockLogin).not.toHaveBeenCalled();
  });

  it("exibe erro 401 e não grava tokens", async () => {
    const user = userEvent.setup();

    mockLogin.mockRejectedValueOnce({
      response: {
        status: 401,
        data: {
          detail: "Credenciais inválidas.",
        },
      },
    });

    renderLoginForm();

    await user.type(
      screen.getByLabelText(/^e-mail$/i),
      "lucas@example.com",
    );

    await user.type(
      screen.getByLabelText(/^senha$/i),
      "senha_incorreta",
    );

    await user.click(
      screen.getByRole("button", {
        name: /acessar nōta/i,
      }),
    );

    expect(
      await screen.findByText(
        "Credenciais inválidas.",
      ),
    ).toBeInTheDocument();

    expect(mockLogin).toHaveBeenCalledWith({
      email: "lucas@example.com",
      password: "senha_incorreta",
    });

    expect(
      localStorage.getItem("nota_access_token"),
    ).toBeNull();

    expect(
      localStorage.getItem("nota_refresh_token"),
    ).toBeNull();
  });
});