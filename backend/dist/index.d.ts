import 'dotenv/config';
import { Pool } from 'pg';
import knex from 'knex';
import { Server } from 'socket.io';
declare const app: import("express-serve-static-core").Express;
declare const io: Server<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
declare const knexInstance: knex.Knex<any, unknown[]>;
declare const pool: Pool;
declare global {
    namespace Express {
        interface Request {
            file?: Multer.File;
            userId?: string;
        }
    }
}
export { app, io, knexInstance, pool };
//# sourceMappingURL=index.d.ts.map