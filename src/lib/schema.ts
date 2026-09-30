import { pgTable, text, timestamp, uuid, integer, numeric, date, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const profiles = pgTable("profiles", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  age: integer("age"),
  sex: text("sex"),
  heightCm: numeric("height_cm", { precision: 5, scale: 2 }),
  weightKg: numeric("weight_kg", { precision: 5, scale: 2 }),
  goal: text("goal").default("muscle_gain"),
  baselineActivity: text("baseline_activity").default("light"),
  onboardingDone: boolean("onboarding_done").default(false).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const foodEntries = pgTable("food_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  logDate: date("log_date").notNull(),
  mealType: text("meal_type").notNull(),
  name: text("name").notNull(),
  quantity: numeric("quantity", { precision: 8, scale: 2 }).default("1").notNull(),
  unit: text("unit").default("porção").notNull(),
  calories: numeric("calories", { precision: 8, scale: 2 }).default("0").notNull(),
  protein: numeric("protein", { precision: 8, scale: 2 }).default("0").notNull(),
  carbs: numeric("carbs", { precision: 8, scale: 2 }).default("0").notNull(),
  fat: numeric("fat", { precision: 8, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const workoutPlans = pgTable("workout_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  weekday: integer("weekday").notNull(),
  type: text("type").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  intensity: text("intensity").default("moderate").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const workoutSessions = pgTable("workout_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  logDate: date("log_date").notNull(),
  type: text("type").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  intensity: text("intensity").default("moderate").notNull(),
  caloriesEstimated: numeric("calories_estimated", { precision: 8, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const weightLogs = pgTable("weight_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  logDate: date("log_date").notNull(),
  weightKg: numeric("weight_kg", { precision: 5, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const userRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, { fields: [users.id], references: [profiles.userId] }),
  foodEntries: many(foodEntries),
  workoutPlans: many(workoutPlans),
  workoutSessions: many(workoutSessions),
  weightLogs: many(weightLogs)
}));
