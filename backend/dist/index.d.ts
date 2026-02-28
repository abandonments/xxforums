import 'dotenv/config';
declare const app: import("express-serve-static-core").Express;
declare global {
    namespace Express {
        interface Request {
            file?: Express.Multer.File;
        }
    }
}
export default app;
//# sourceMappingURL=index.d.ts.map