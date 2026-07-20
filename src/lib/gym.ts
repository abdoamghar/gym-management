import { prisma } from "./prisma";

/** Single-gym mode: returns the first (only) gym. */
export async function getCurrentGym() {
  const gym = await prisma.gym.findFirst({
    include: { messageTemplates: true },
  });
  if (!gym) throw new Error("No gym configured. Run: npm run db:seed");
  return gym;
}

export async function getGymId() {
  const gym = await getCurrentGym();
  return gym.id;
}
