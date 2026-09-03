// nodemailer@9 ships no bundled types, and @types/nodemailer hasn't been
// published for v9 yet — this keeps the import untyped rather than
// blocking the build. Remove once proper types are available.
declare module "nodemailer";
