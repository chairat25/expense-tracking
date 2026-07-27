import dotenv from "dotenv";
dotenv.config({ path: ".env.development" });
import { sql } from "drizzle-orm";
import { db } from "./src/db";

async function main() {
  try {
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE friendship_status AS ENUM ('pending', 'accepted', 'rejected');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS public.friendships (
        id serial PRIMARY KEY,
        requester_id uuid NOT NULL,
        receiver_id uuid NOT NULL,
        status friendship_status NOT NULL DEFAULT 'pending',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT friendships_pair_uq UNIQUE (requester_id, receiver_id)
      );
    `);

    await db.execute(sql`
      ALTER TABLE public.user_settings ADD COLUMN IF NOT EXISTS show_community boolean DEFAULT true;
    `);

    console.log("Successfully created friendships table and show_community column!");
  } catch (err) {
    console.error("Friendship migration error:", err);
  } finally {
    process.exit(0);
  }
}

main();
