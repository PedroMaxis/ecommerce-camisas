import { describe, expect, it } from "vitest";
import { reais, totalEstoque, ultimas } from "./dinheiro";

const normal = (s) => s.replace(/\s/g, " "); // o Intl usa espaço sem quebra entre R$ e o valor

describe("dinheiro", () => {
  it("formata centavos em reais", () => {
    expect(normal(reais(8900))).toBe("R$ 89,00");
    expect(normal(reais(123456))).toBe("R$ 1.234,56");
    expect(normal(reais(5))).toBe("R$ 0,05");
  });
  it("soma estoque e avisa das últimas unidades", () => {
    expect(totalEstoque({ P: 2, M: 3 })).toBe(5);
    expect(totalEstoque(undefined)).toBe(0);
    expect(ultimas({ P: 2, M: 3 })).toBe(5);
    expect(ultimas({ P: 20 })).toBe(0);
    expect(ultimas({ P: 0 })).toBe(0);
  });
});
