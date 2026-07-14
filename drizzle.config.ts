import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Next อ่าน .env.local อยู่แล้ว แต่ drizzle-kit รันนอก Next เลยต้องโหลดเอง
config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
