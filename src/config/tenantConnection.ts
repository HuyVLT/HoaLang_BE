import mongoose, { Connection } from 'mongoose';

/**
 * In-memory connection pool: dbName → active Mongoose Connection.
 * Prevents memory leaks by reusing connections across requests.
 */
const connectionPool = new Map<string, Connection>();

const BASE_MONGO_URI =
  process.env.TENANT_MONGODB_BASE_URI || 'mongodb://localhost:27017';

/**
 * Get (or create + cache) a Mongoose Connection for a given tenant database.
 *
 * @param dbName  The tenant database name, e.g. "tenant_battrang"
 * @returns       A ready Mongoose Connection bound to that database
 */
export const getTenantConnection = async (dbName: string): Promise<Connection> => {
  // 1. Return cached connection if alive
  const cached = connectionPool.get(dbName);
  if (cached && cached.readyState === 1) {
    return cached;
  }

  // 2. Build the full connection URI for the tenant database
  const uri = `${BASE_MONGO_URI}/${dbName}`;

  try {
    const conn = mongoose.createConnection(uri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 30_000,
      serverSelectionTimeoutMS: 5_000,
      autoIndex: process.env.NODE_ENV !== 'production',
    });

    // Wait until connection is open
    await new Promise<void>((resolve, reject) => {
      conn.once('open', () => {
        console.log(`[TenantDB] Connected to ${dbName}`);
        resolve();
      });
      conn.once('error', (err) => {
        console.error(`[TenantDB] Failed to connect to ${dbName}:`, err);
        connectionPool.delete(dbName);
        reject(err);
      });
    });

    // Lifecycle logging
    conn.on('disconnected', () => {
      console.warn(`[TenantDB] ${dbName} disconnected — evicting from pool.`);
      connectionPool.delete(dbName);
    });

    conn.on('reconnected', () => {
      console.log(`[TenantDB] ${dbName} reconnected.`);
      connectionPool.set(dbName, conn);
    });

    conn.on('error', (err) => {
      console.error(`[TenantDB] Connection error on ${dbName}:`, err);
    });

    // 3. Store in pool and return
    connectionPool.set(dbName, conn);
    return conn;
  } catch (error) {
    console.error(`[TenantDB] Unable to establish connection to ${dbName}:`, error);
    throw error;
  }
};

/**
 * Close all tenant connections gracefully (e.g. on SIGTERM).
 */
export const closeAllTenantConnections = async (): Promise<void> => {
  const entries = Array.from(connectionPool.entries());
  await Promise.all(
    entries.map(async ([dbName, conn]) => {
      await conn.close();
      connectionPool.delete(dbName);
      console.log(`[TenantDB] Closed connection to ${dbName}`);
    })
  );
};

/**
 * Returns current pool snapshot (for health checks / monitoring).
 */
export const getConnectionPoolStatus = (): Record<string, number> => {
  const status: Record<string, number> = {};
  connectionPool.forEach((conn, dbName) => {
    status[dbName] = conn.readyState; // 0=disconnected, 1=connected, 2=connecting, 3=disconnecting
  });
  return status;
};
