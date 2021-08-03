import prisma_pkg from '@prisma/client';
import type {Prisma} from '@prisma/client';
import faker_pkg from 'faker';

const {PrismaClient} = prisma_pkg;
// @ts-expect-error
const {default: fakerDefault} = faker_pkg;
const faker = fakerDefault as Faker.FakerStatic;

function randomUserData(): Prisma.UserCreateInput {
  const tagNumber = faker.unique(faker.datatype.number, [
    {min: 1000, max: 9999}
  ]);
  const userName = faker.unique(faker.internet.userName);
  const discordTag = `${userName}#${tagNumber}`;
  const profileUrl = faker.unique(faker.internet.avatar);

  return {
    discordTag,
    twitchDisplayName: userName,
    twitchName: userName.toLowerCase(),
    profileUrl
  };
}

const prisma = new PrismaClient();
async function main() {
  const times = async (n: number, f: () => Promise<void>) => {
    while (n-- > 0) void f();
  };

  console.log('Start seeding ...');
  await times(50, async () => {
    const user = await prisma.user.create({
      data: randomUserData()
    });
    console.log(`Created user with id: ${user.id}`);
  });
  console.log('Seeding finished.');
}

main().finally(async () => {
  await prisma.$disconnect();
});
