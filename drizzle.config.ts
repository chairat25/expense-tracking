import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Next อ่าน .env.development อยู่แล้ว แต่ drizzle-kit รันนอก Next เลยต้องโหลดเอง
config({ path: ".env.development" });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
