import { PrismaClient, TemplateKey } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, subDays, startOfDay } from "date-fns";

const prisma = new PrismaClient();

const DEFAULT_TEMPLATES: {
  key: TemplateKey;
  bodyFr: string;
  bodyAr: string;
}[] = [
  {
    key: "welcome",
    bodyFr: `Bonjour {{name}} !

Bienvenue à {{gymName}}.

Votre abonnement est actif jusqu'au {{endDate}}.
Tarif : {{price}}

Adresse : {{address}}
Tél : {{gymPhone}}

À bientôt !`,
    bodyAr: `مرحبا {{name}}!

أهلا بك في {{gymName}}.

اشتراكك ساري حتى {{endDate}}.
السعر: {{price}}

العنوان: {{address}}
الهاتف: {{gymPhone}}

إلى اللقاء!`,
  },
  {
    key: "payment_reminder",
    bodyFr: `Bonjour {{name}},

Votre abonnement à {{gymName}} expire le {{endDate}}.
Merci de renouveler ({{price}}) pour continuer.

Cordialement,
{{gymName}}`,
    bodyAr: `مرحبا {{name}}،

ينتهي اشتراكك في {{gymName}} بتاريخ {{endDate}}.
يرجى التجديد ({{price}}) للمتابعة.

مع تحيات،
{{gymName}}`,
  },
  {
    key: "closure",
    bodyFr: `Bonjour {{name}},

{{gymName}} sera fermé du {{startDate}} au {{endDate}} ({{title}}).

Merci de votre compréhension.`,
    bodyAr: `مرحبا {{name}}،

سيغلق {{gymName}} من {{startDate}} إلى {{endDate}} ({{title}}).

شكرا لتفهمكم.`,
  },
];

async function main() {
  const today = startOfDay(new Date());
  const passwordHash = await bcrypt.hash("admin123", 10);

  let gym = await prisma.gym.findFirst();

  if (!gym) {
    gym = await prisma.gym.create({
      data: {
        name: "Fitness Club Casa",
        phone: "0522000000",
        address: "Casablanca, Maroc",
        monthlyPrice: 250,
        membershipDays: 30,
        graceDays: 3,
        reminderDays: 3,
        defaultLocale: "fr",
      },
    });
  }

  const existingAdmin = await prisma.user.findFirst({ where: { email: "admin@gym.ma" } });
  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        email: "admin@gym.ma",
        passwordHash,
        name: "Manager",
        role: "MANAGER",
        gymId: gym.id,
      },
    });
  }

  if ((await prisma.messageTemplate.count({ where: { gymId: gym.id } })) === 0) {
    await prisma.messageTemplate.createMany({
      data: DEFAULT_TEMPLATES.map((template) => ({
        gymId: gym.id,
        ...template,
      })),
    });
  }

  const demoMembers = [
    {
      firstName: "Abdelhamid",
      lastName: "Amghar",
      phone: "0612895179",
      cin: "PA4235",
      preferredLocale: "fr",
      status: "ACTIVE" as const,
      periods: [{
        startDate: subDays(today, 10),
        endDate: addDays(today, 20),
        amountPaid: 250,
        paidAt: subDays(today, 10),
      }],
    },
    {
      firstName: "Karim",
      lastName: "Hssaine",
      phone: "0620000001",
      cin: "P25373",
      preferredLocale: "ar",
      status: "ACTIVE" as const,
      periods: [{
        startDate: subDays(today, 5),
        endDate: addDays(today, 2),
        amountPaid: 250,
        paidAt: subDays(today, 5),
      }],
    },
    {
      firstName: "Sofia",
      lastName: "Benali",
      phone: "0630000002",
      cin: "R10456",
      preferredLocale: "fr",
      status: "FROZEN" as const,
      freezeStart: subDays(today, 5),
      freezeEnd: addDays(today, 10),
      periods: [{
        startDate: subDays(today, 15),
        endDate: addDays(today, 5),
        amountPaid: 250,
        paidAt: subDays(today, 15),
      }],
    },
    {
      firstName: "Youssef",
      lastName: "Mansouri",
      phone: "0640000003",
      cin: "X33211",
      preferredLocale: "fr",
      status: "EXPIRED" as const,
      periods: [{
        startDate: subDays(today, 45),
        endDate: subDays(today, 5),
        amountPaid: 250,
        paidAt: subDays(today, 45),
      }],
    },
  ];

  for (const memberData of demoMembers) {
    const existingMember = await prisma.member.findFirst({
      where: { gymId: gym.id, phone: memberData.phone },
    });

    if (!existingMember) {
      await prisma.member.create({
        data: {
          gymId: gym.id,
          firstName: memberData.firstName,
          lastName: memberData.lastName,
          phone: memberData.phone,
          cin: memberData.cin,
          preferredLocale: memberData.preferredLocale,
          status: memberData.status,
          freezeStart: memberData.freezeStart,
          freezeEnd: memberData.freezeEnd,
          periods: {
            create: memberData.periods.map((period) => ({
              gymId: gym.id,
              ...period,
            })),
          },
        },
      });
    }
  }

  if ((await prisma.holiday.count({ where: { gymId: gym.id } })) === 0) {
    await prisma.holiday.create({
      data: {
        gymId: gym.id,
        title: "Eid holiday",
        startDate: addDays(today, 2),
        endDate: addDays(today, 5),
      },
    });
  }

  console.log("Seeded gym:", gym.name);
  console.log("Login: admin@gym.ma / admin123");
  console.log("Demo members created with due, grace, frozen, and expired states.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
