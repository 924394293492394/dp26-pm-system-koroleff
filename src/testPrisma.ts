import { prisma } from "./lib/prisma.js";

async function main() {
  const users = await prisma.userAuth.findMany();
  console.log("Users:", users);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });