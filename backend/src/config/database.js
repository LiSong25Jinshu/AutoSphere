import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'autosphere_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'password',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

export const connectDB = async () => {
  try {
    // Skip database connection in test environment or if DB is not available
    if (process.env.NODE_ENV === 'test') {
      console.log('Skipping database connection in test environment');
      return;
    }
    
    await sequelize.authenticate();
    console.log('PostgreSQL connected successfully');
    
    // Sync database in development
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('Database synchronized');
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