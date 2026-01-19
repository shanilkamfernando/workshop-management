import pkg from "pg";
import dotenv from "dotenv";
dotenv.config();

const { Pool } = pkg;

//check if we're in production
const isProduction = process.env.NODE_ENV === "production";

//production configuration (render provides DB_URL)
const productionConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, //require for render postgreSQL
  },
};

//Development configuration (local postgreSQL)
const developmentConfig = {
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "workshop",
  password: process.env.DB_PASS || "",
  port: parseInt(process.env.DB_PORT) || 5432, // 5432
};
// const pool = new Pool({
//   user: process.env.DB_USER,
//   host: process.env.DB_HOST,
//   database: process.env.DB_NAME,
//   password: process.env.DB_PASS,
//   port: process.env.DB_PORT, // 5432
// });

//use production or development config based on environment
const pool = new Pool(isProduction ? productionConfig : developmentConfig);

//test connection
pool
  .connect()
  .then(() => {
    console.log(
      `✅ Connected to PostgreSQL database (${
        isProduction ? "PRODUCTION" : "DEVELOPMENT"
      })`
    );
  })
  .catch((err) => {
    console.error("❌ DB connection error:", err);
  });

export default pool;
