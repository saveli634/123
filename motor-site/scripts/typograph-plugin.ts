import type { Plugin } from "vite";
import { typograph } from "../src/lib/typograph.ts";

/**
 * Типограф при сборке: проходит по строковым литералам в src/content/*.ts и src/config.ts
 * и расставляет неразрывные пробелы, тире и т. п. (функция — src/lib/typograph.ts).
 * В этих файлах строки пишутся в двойных кавычках; ключи объектов — без кавычек.
 */
const TARGET = /[\\/]src[\\/](content[\\/][^\\/]+\.ts|config\.ts)$/;
const STRING = /"((?:[^"\\\n]|\\.)*)"/g;

export function typographPlugin(): Plugin {
  return {
    name: "ru-typograph",
    enforce: "pre",
    transform(code, id) {
      if (!TARGET.test(id.split("?")[0])) return null;
      let changed = false;
      const out = code.replace(STRING, (whole, inner: string) => {
        const value = JSON.parse(`"${inner}"`) as string;
        const fixed = typograph(value);
        if (fixed === value) return whole;
        changed = true;
        return JSON.stringify(fixed);
      });
      return changed ? { code: out, map: null } : null;
    },
  };
}
