const {
  repairStringEncoding,
  repairTextEncodingDeep,
} = require("../../utils/textEncoding");

describe("textEncoding utility", () => {
  test("repairs common UTF-8 mojibake in strings", () => {
    expect(repairStringEncoding("CrÃ¨me brÃ»lÃ©e")).toBe("Crème brûlée");
  });

  test("leaves already-correct unicode unchanged", () => {
    expect(repairStringEncoding("Crème brûlée")).toBe("Crème brûlée");
  });

  test("repairs nested objects and arrays", () => {
    expect(
      repairTextEncodingDeep({
        name: "PurÃ©e de pommes",
        tags: ["EntrÃ©e", "DÃ©jeuner"],
      }),
    ).toEqual({
      name: "Purée de pommes",
      tags: ["Entrée", "Déjeuner"],
    });
  });
});