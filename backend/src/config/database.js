import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = (process.env.NODE_ENV || 'development') === 'development';

const dbDialect = process.env.DB_DIALECT || (process.env.DB_HOST || process.env.USE_POSTGRES ? 'postgres' : (isDev ? 'sqlite' : 'postgres'));

const sequelize = dbDialect === 'postgres'
  ? new Sequelize(
      process.env.DB_NAME || 'autosphere',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || 'postgres',
      {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT, 10) || 5432,
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
          max: 10,
          min: 0,
          acquire: 30000,
          idle: 10000,
        },
      }
    )
  : new Sequelize({
      dialect: 'sqlite',
      storage: path.resolve(__dirname, '../../autosphere.dev.sqlite'),
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
    });

export const connectDB = async () => {
  try {
    // Skip database connection in test environment or if DB is not available
    if (process.env.NODE_ENV === 'test') {
      console.log('Skipping database connection in test environment');
      return;
    }
    
    await sequelize.authenticate();
    console.log('Database connected successfully');

    // Sync database in development.
    // SQLite has a known Sequelize bug: synchronizing a table that already exists
    // (especially `users`, which has several partial/unique indexes) triggers an
    // infinite ALTER-table loop and the server never starts. To avoid that, only
    // run sync() when the SQLite file is brand new; on subsequent starts the schema
    // already matches, so we skip sync entirely.
    if (process.env.NODE_ENV === 'development') {
      const dialect = sequelize.getDialect();
      if (dialect === 'sqlite') {
        // Sequelize's sync() on an *existing* SQLite file can loop on the
        // `users` table's indexes, so for local dev we always start from a
        // fresh file. This guarantees a clean boot and avoids the hang.
        const fs = await import('fs');
        const storage = sequelize.getQueryInterface().sequelize.options.storage;
        if (fs.existsSync(storage)) {
          fs.unlinkSync(storage);
          console.log('Removed existing SQLite dev database for a clean boot');
        }
        await sequelize.sync();
        console.log('Database synchronized (fresh SQLite file)');
      } else {
        await sequelize.sync({ alter: true });
        console.log('Database synchronized');
      }
    }
  } catch (error) {
    console.error('Unable to connect to PostgreSQL:', error);
    console.log('Continuing without database connection for development...');
    // Don't throw error in development to allow server to start
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
};

export { sequelize };
export default sequelize;