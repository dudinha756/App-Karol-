export type ParsedDietMeal = {
  name: string;
  scheduledTime?: string;
  calories: number;
  items: string[];
  note: string;
};

const kcalPer100g: Array<[RegExp, number]> = [
  [/arroz/i, 130],
  [/feij[aã]o/i, 76],
  [/frango/i, 165],
  [/carne bovina|patinho|cox[aã]o mole/i, 200],
  [/ovo/i, 143],
  [/p[aã]o/i, 265],
  [/tapioca/i, 230],
  [/banana/i, 89],
  [/ma[cç][aã]/i, 52],
  [/aveia/i, 389],
  [/leite/i, 61],
  [/iogurte/i, 60],
  [/mussarela|muçarela|queijo/i, 300],
  [/batata doce/i, 86],
  [/batata/i, 87],
  [/macarr[aã]o/i, 157],
  [/whey/i, 400],
  [/granola/i, 450],
  [/azeite/i, 884],
  [/pasta de amendoim|amendoim/i, 588]
];

const unitCalories: Array<[RegExp, number]> = [
  [/\bbanana\b/i, 90],
  [/\bma[cç][aã]\b/i, 75],
  [/\bovo\b/i, 72],
  [/\bfatia.*p[aã]o|p[aã]o.*fatia/i, 65]
];

function n(v: string) {
  return Number(v.replace(",", "."));
}

function explicitCalories(line: string) {
  const m = line.match(/(\d+(?:[.,]\d+)?)\s*(?:kcal|calorias?)/i);
  return m ? n(m[1]) : 0;
}

function macroCalories(line: string) {
  const p = line.match(/(?:prote[ií]na|\bp\b)\s*[:=-]?\s*(\d+(?:[.,]\d+)?)\s*g/i);
  const c = line.match(/(?:carbo(?:idratos?)?|\bc\b)\s*[:=-]?\s*(\d+(?:[.,]\d+)?)\s*g/i);
  const f = line.match(/(?:gorduras?|lip[ií]dios?|\bg\b)\s*[:=-]?\s*(\d+(?:[.,]\d+)?)\s*g/i);
  if (!p && !c && !f) return 0;
  return (p ? n(p[1]) * 4 : 0) + (c ? n(c[1]) * 4 : 0) + (f ? n(f[1]) * 9 : 0);
}

function estimatedCalories(line: string) {
  const grams = line.match(/(\d+(?:[.,]\d+)?)\s*g\b/i);
  if (grams) {
    const amount = n(grams[1]);
    for (const [rx, per100] of kcalPer100g) {
      if (rx.test(line)) return amount * per100 / 100;
    }
  }

  const units = line.match(/(\d+(?:[.,]\d+)?)\s*(?:un(?:idade)?s?|unid\.?)/i);
  if (units) {
    const qty = n(units[1]);
    for (const [rx, kcal] of unitCalories) {
      if (rx.test(line)) return qty * kcal;
    }
  }

  return 0;
}

function isMealHeading(line: string) {
  return /(caf[eé] da manh[aã]|desjejum|lanche|almo[cç]o|jantar|ceia|pr[eé][- ]?treino|p[oó]s[- ]?treino|refei[cç][aã]o)/i.test(line);
}

function mealName(line: string) {
  const m = line.match(/(caf[eé] da manh[aã]|desjejum|lanche(?: da manh[aã]| da tarde)?|almo[cç]o|jantar|ceia|pr[eé][- ]?treino|p[oó]s[- ]?treino|refei[cç][aã]o\s*\d*)/i);
  return m ? m[1].replace(/\b\w/g, s => s.toUpperCase()) : "Refeição";
}

function timeFrom(line: string) {
  const m = line.match(/\b([01]?\d|2[0-3])[:h]([0-5]\d)\b/i);
  if (m) return `${m[1].padStart(2,"0")}:${m[2]}`;
  const h = line.match(/\b([01]?\d|2[0-3])h\b/i);
  return h ? `${h[1].padStart(2,"0")}:00` : undefined;
}

export function parseDietText(text: string): ParsedDietMeal[] {
  const lines = text
    .replace(/\r/g, "")
    .split("\n")
    .map(x => x.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const meals: ParsedDietMeal[] = [];
  let current: {name:string; scheduledTime?:string; items:string[]} | null = null;

  const push = () => {
    if (!current || current.items.length === 0) return;
    let calories = 0;
    let usedExplicit = false;
    let usedEstimate = false;

    for (const item of current.items) {
      const direct = explicitCalories(item);
      const macros = direct ? 0 : macroCalories(item);
      const estimate = direct || macros ? 0 : estimatedCalories(item);
      if (direct || macros) usedExplicit = true;
      if (estimate) usedEstimate = true;
      calories += direct || macros || estimate;
    }

    meals.push({
      name: current.name,
      scheduledTime: current.scheduledTime,
      calories: Math.round(calories),
      items: current.items,
      note: calories === 0
        ? "Calorias não identificadas automaticamente; ajuste manualmente se necessário."
        : usedEstimate
          ? "Estimativa automática com base nas quantidades e valores médios dos alimentos."
          : usedExplicit
            ? "Calculado a partir das calorias ou macronutrientes informados no PDF."
            : "Estimativa automática."
    });
  };

  for (const line of lines) {
    if (isMealHeading(line)) {
      push();
      current = { name: mealName(line), scheduledTime: timeFrom(line), items: [] };
      continue;
    }

    if (!current) continue;

    if (line.length > 2 && !/^(op[cç][aã]o|substitui[cç][aã]o|observa[cç][aã]o|orienta[cç][aã]o)\b/i.test(line)) {
      current.items.push(line);
    }
  }

  push();

  if (meals.length === 0 && lines.length) {
    const items = lines.filter(x => /\d/.test(x) || /kcal|g\b|ml\b/i.test(x)).slice(0, 20);
    if (items.length) {
      let calories = 0;
      for (const item of items) calories += explicitCalories(item) || macroCalories(item) || estimatedCalories(item);
      meals.push({
        name: "Plano alimentar",
        calories: Math.round(calories),
        items,
        note: calories ? "Estimativa automática do conteúdo identificado no PDF." : "Não foi possível calcular automaticamente as calorias."
      });
    }
  }

  return meals;
}
