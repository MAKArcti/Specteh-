import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { entities } from './database.module';

config();

/**
 * Standalone DataSource for the TypeORM CLI (migration:generate/run/revert).
 * The running app uses DatabaseModule's forRootAsync instead; kept in sync
 * manually since the CLI cannot consume a Nest module.
 */
export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'spectech',
  password: process.env.DB_PASSWORD || 'spectech',
  database: process.env.DB_NAME || 'spectech',
  entities,
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
});
