import { pgTable, text, timestamp, uuid, integer, numeric, date, boolean, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  canInvite: boolean("can_invite").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const passwordResetCodes = pgTable("password_reset_codes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  codeHash: text("code_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  attempts: integer("attempts").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const userInvitations = pgTable("user_invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  invitedBy: uuid("invited_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const tacoFoods = pgTable("taco_foods", {
  id: integer("id").primaryKey(),
  description: text("description").notNull(),
  searchName: text("search_name").notNull(),
  category: text("category"),
  energyKcal: numeric("energy_kcal", { precision: 12, scale: 6 }),
  proteinG: numeric("protein_g", { precision: 12, scale: 6 }),
  carbsG: numeric("carbs_g", { precision: 12, scale: 6 }),
  fatG: numeric("fat_g", { precision: 12, scale: 6 }),
  source: text("source").default("NEPA/UNICAMP TACO 4ª ed. (2011)").notNull()
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

export const foodLibrary = pgTable("food_library", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  referenceQuantity: numeric("reference_quantity", { precision: 8, scale: 2 }).default("100").notNull(),
  referenceUnit: text("reference_unit").default("g").notNull(),
  calories: numeric("calories", { precision: 8, scale: 2 }).default("0").notNull(),
  protein: numeric("protein", { precision: 8, scale: 2 }).default("0").notNull(),
  carbs: numeric("carbs", { precision: 8, scale: 2 }).default("0").notNull(),
  fat: numeric("fat", { precision: 8, scale: 2 }).default("0").notNull(),
  sourceType: text("source_type"),
  sourceRef: text("source_ref"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
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

export const calendarEvents = pgTable("calendar_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  eventType: text("event_type").default("compromisso").notNull(),
  startDate: date("start_date").notNull(),
  startTime: text("start_time").notNull(),
  durationMinutes: integer("duration_minutes").default(60).notNull(),
  recurrence: text("recurrence").default("none").notNull(),
  recurrenceUntil: date("recurrence_until"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const strengthDocuments = pgTable("strength_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  rawText: text("raw_text"),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull()
});

export const strengthRoutines = pgTable("strength_routines", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  sourceDocumentId: uuid("source_document_id").references(() => strengthDocuments.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
});

export const strengthExercises = pgTable("strength_exercises", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  routineId: uuid("routine_id").notNull().references(() => strengthRoutines.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").default(0).notNull(),
  name: text("name").notNull(),
  sets: integer("sets"),
  reps: text("reps"),
  restSeconds: integer("rest_seconds"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const strengthProgressLogs = pgTable("strength_progress_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  exerciseId: uuid("exercise_id").notNull().references(() => strengthExercises.id, { onDelete: "cascade" }),
  logDate: date("log_date").notNull(),
  setsCompleted: integer("sets_completed"),
  repsCompleted: text("reps_completed"),
  weightKg: numeric("weight_kg", { precision: 7, scale: 2 }),
  rpe: numeric("rpe", { precision: 4, scale: 1 }),
  notes: text("notes"),
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

export const dietDocuments = pgTable("diet_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  rawText: text("raw_text"),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).defaultNow().notNull()
});

export const dietMeals = pgTable("diet_meals", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  documentId: uuid("document_id").notNull().references(() => dietDocuments.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").default(0).notNull(),
  name: text("name").notNull(),
  scheduledTime: text("scheduled_time"),
  calories: numeric("calories", { precision: 8, scale: 2 }).default("0").notNull(),
  itemsJson: text("items_json").default("[]").notNull(),
  calculationNote: text("calculation_note"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const dietChoiceGroups = pgTable("diet_choice_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  mealId: uuid("meal_id").notNull().references(() => dietMeals.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  selectionType: text("selection_type").default("single").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const dietChoiceOptions = pgTable("diet_choice_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  mealId: uuid("meal_id").notNull().references(() => dietMeals.id, { onDelete: "cascade" }),
  groupId: uuid("group_id").notNull().references(() => dietChoiceGroups.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  defaultQuantity: numeric("default_quantity", { precision: 8, scale: 2 }).notNull(),
  referenceQuantity: numeric("reference_quantity", { precision: 8, scale: 2 }).default("100").notNull(),
  unit: text("unit").default("g").notNull(),
  caloriesRef: numeric("calories_ref", { precision: 10, scale: 4 }).default("0").notNull(),
  proteinRef: numeric("protein_ref", { precision: 10, scale: 4 }).default("0").notNull(),
  carbsRef: numeric("carbs_ref", { precision: 10, scale: 4 }).default("0").notNull(),
  fatRef: numeric("fat_ref", { precision: 10, scale: 4 }).default("0").notNull(),
  tacoFoodId: integer("taco_food_id").references(() => tacoFoods.id, { onDelete: "set null" }),
  source: text("source").default("Plano alimentar").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
});

export const dietOptionSelections = pgTable("diet_option_selections", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  mealId: uuid("meal_id").notNull().references(() => dietMeals.id, { onDelete: "cascade" }),
  groupId: uuid("group_id").notNull().references(() => dietChoiceGroups.id, { onDelete: "cascade" }),
  optionId: uuid("option_id").notNull().references(() => dietChoiceOptions.id, { onDelete: "cascade" }),
  logDate: date("log_date").notNull(),
  selected: boolean("selected").default(true).notNull(),
  quantity: numeric("quantity", { precision: 8, scale: 2 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull()
}, (t) => ({
  uniqueDietOptionSelection: unique("diet_option_selections_unique").on(t.userId, t.optionId, t.logDate)
}));

export const dietMealChecks = pgTable("diet_meal_checks", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  mealId: uuid("meal_id").notNull().references(() => dietMeals.id, { onDelete: "cascade" }),
  logDate: date("log_date").notNull(),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull()
}, (t) => ({
  uniqueMealCheck: unique("diet_meal_checks_unique").on(t.userId, t.mealId, t.logDate)
}));

export const userRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, { fields: [users.id], references: [profiles.userId] }),
  foodLibrary: many(foodLibrary),
  foodEntries: many(foodEntries),
  calendarEvents: many(calendarEvents),
  strengthDocuments: many(strengthDocuments),
  strengthRoutines: many(strengthRoutines),
  strengthExercises: many(strengthExercises),
  strengthProgressLogs: many(strengthProgressLogs),
  workoutPlans: many(workoutPlans),
  workoutSessions: many(workoutSessions),
  weightLogs: many(weightLogs),
  dietDocuments: many(dietDocuments),
  dietMeals: many(dietMeals),
  dietChoiceGroups: many(dietChoiceGroups),
  dietChoiceOptions: many(dietChoiceOptions),
  dietOptionSelections: many(dietOptionSelections),
  dietMealChecks: many(dietMealChecks),
  passwordResetCodes: many(passwordResetCodes),
  invitationsSent: many(userInvitations)
}));
