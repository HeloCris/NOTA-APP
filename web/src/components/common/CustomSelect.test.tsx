import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CustomSelect } from "./CustomSelect";

const options = [
  { value: "all", label: "Tudo" },
  { value: "name", label: "Nome" },
  { value: "note", label: "Nota" },
];

describe("CustomSelect", () => {
  it("renderiza a opção selecionada e abre o menu ao clicar", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <CustomSelect
        value="all"
        onChange={onChange}
        options={options}
        ariaLabel="Filtrar busca"
      />,
    );

    const button = screen.getByRole("button", { name: "Filtrar busca" });
    expect(button).toHaveTextContent("Tudo");

    await user.click(button);

    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Nome" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Nota" })).toBeInTheDocument();
  });

  it("seleciona uma nova opção e fecha o menu", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <CustomSelect
        value="all"
        onChange={onChange}
        options={options}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Tudo" }));
    await user.click(screen.getByRole("option", { name: "Nota" }));

    expect(onChange).toHaveBeenCalledWith("note");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("fecha ao pressionar Escape", async () => {
    const user = userEvent.setup();
    render(
      <CustomSelect
        value="all"
        onChange={vi.fn()}
        options={options}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Tudo" }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
