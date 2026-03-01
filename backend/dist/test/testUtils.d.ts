import knex from 'knex';
import { UserProfile } from '../src/types/user.js';
export declare const knexInstance: knex.Knex<any, unknown[]>;
export declare function clearDatabase(): Promise<void>;
export declare function stubAuthMiddleware(): void;
export declare function restoreAuthMiddleware(): void;
export declare function createTestUser(overrides?: Partial<UserProfile>): Promise<UserProfile>;
//# sourceMappingURL=testUtils.d.ts.map