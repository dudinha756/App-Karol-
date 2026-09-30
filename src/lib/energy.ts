export type Sex = "female" | "male";
export type Goal = "muscle_gain" | "maintain" | "fat_loss";

export function calculateBmr({ sex, weightKg, heightCm, age }: { sex: Sex; weightKg: number; heightCm: number; age: number }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(sex === "male" ? base + 5 : base - 161);
}

const baselineFactors: Record<string, number> = {
  sedentary: 1.2,
  light: 1.35,
  moderate: 1.5
};

export function estimateExerciseCalories({ type, minutes, weightKg, intensity = "moderate" }: { type: string; minutes: number; weightKg: number; intensity?: string }) {
  const key = type.toLowerCase();
  let met = 5;
  if (key.includes("jiu") || key.includes("bjj")) met = 8;
  else if (key.includes("muay") || key.includes("box")) met = 10.3;
  else if (key.includes("corr") || key.includes("run")) met = 8.3;
  else if (key.includes("camin")) met = 3.8;
  else if (key.includes("muscul") || key.includes("força") || key.includes("strength")) met = 5;

  if (intensity === "light") met *= 0.82;
  if (intensity === "high") met *= 1.16;
  return Math.round((met * 3.5 * weightKg * minutes) / 200);
}

export function calculateTargets({ bmr, baselineActivity = "light", exerciseCalories = 0, goal = "muscle_gain", weightKg }: { bmr: number; baselineActivity?: string; exerciseCalories?: number; goal?: Goal; weightKg: number }) {
  const baseTdee = Math.round(bmr * (baselineFactors[baselineActivity] || baselineFactors.light));
  const maintenance = baseTdee + exerciseCalories;
  const adjustment = goal === "muscle_gain" ? 180 : goal === "fat_loss" ? -250 : 0;
  const calories = Math.max(1200, maintenance + adjustment);
  const protein = Math.round(weightKg * 1.8);
  const fat = Math.round(weightKg * 0.9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
  return { baseTdee, maintenance, calories, protein, fat, carbs, adjustment };
}
