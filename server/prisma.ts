import { PrismaClient } from '@prisma/client';

let url = process.env.DATABASE_URL;
if (url && url.startsWith('"') && url.endsWith('"')) {
  url = url.slice(1, -1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: url,
    },
  },
});

export default prisma;
