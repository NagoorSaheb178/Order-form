import mongoose from "mongoose";
import dns from "dns";
import fs from "fs";
import path from "path";

// Fix for Node.js / Windows where local ISP or router DNS blocks SRV queries
try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {
  // ignore if dns server setting is restricted
}

function getMongoUri(): string {
  const envPath = path.join(process.cwd(), ".env.local");
  try {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      const match = content.match(/^MONGODB_URI\s*=\s*(.+)$/m);
      if (match && match[1]) {
        let uri = match[1].trim();
        if (
          (uri.startsWith('"') && uri.endsWith('"')) ||
          (uri.startsWith("'") && uri.endsWith("'"))
        ) {
          uri = uri.slice(1, -1);
        }
        return uri.replace(/<([^>]+)>/g, "$1");
      }
    }
  } catch (e) {
    // continue to process.env fallback
  }

  const envUri =
    process.env.MONGODB_URI ||
    "mongodb://menu:Nagoor271@ac-jxpidhb-shard-00-00.gg7r1on.mongodb.net:27017,ac-jxpidhb-shard-00-01.gg7r1on.mongodb.net:27017,ac-jxpidhb-shard-00-02.gg7r1on.mongodb.net:27017/restaurant_orders?ssl=true&replicaSet=atlas-128119-shard-0&authSource=admin&appName=Test";
  return envUri.replace(/<([^>]+)>/g, "$1");
}


interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
  lastUri: string | null;
}

let cached = (global as any).mongoose as MongooseCache | undefined;

if (!cached) {
  cached = { conn: null, promise: null, lastUri: null };
  (global as any).mongoose = cached;
}

export async function connectToDatabase() {
  const uri = getMongoUri();

  if (!uri) {
    throw new Error("Please define MONGODB_URI in .env.local");
  }

  // Force clean reset if the target URI changed
  if (!cached || cached.lastUri !== uri) {
    if (mongoose.connection.readyState !== 0) {
      try {
        await mongoose.disconnect();
      } catch (e) {
        // ignore disconnect error
      }
    }
    cached = { conn: null, promise: null, lastUri: uri };
    (global as any).mongoose = cached;
  }

  // If already connected to the right database, return connection
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // If no active promise (or previous promise rejected/failed), start a fresh connection
  if (!cached.promise) {
    cached.lastUri = uri;
    cached.promise = mongoose
      .connect(uri, {
        dbName: "restaurant_orders",
        serverSelectionTimeoutMS: 6000,
        connectTimeoutMS: 6000,
      })
      .then((m) => {
        return m;
      })
      .catch((err) => {
        // Clear cached promise on failure so subsequent requests don't reuse the failed promise
        if (cached) {
          cached.promise = null;
          cached.conn = null;
        }
        throw err;
      });
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (err) {
    if (cached) {
      cached.promise = null;
      cached.conn = null;
    }
    throw err;
  }
}
