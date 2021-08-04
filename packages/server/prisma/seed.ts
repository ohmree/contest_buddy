import prisma_pkg from '@prisma/client';
import type {Prisma} from '@prisma/client';
import faker_pkg from 'faker';

const faker: Faker.FakerStatic = faker_pkg;
const {PrismaClient} = prisma_pkg;

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
  console.log('Start seeding ...');
  const users = [];
  for (let i = 0; i <= 50; ++i) {
    users.push(
      prisma.user.create({
        data: randomUserData()
      })
    );
  }

  for (const user of await Promise.all(users)) {
    console.log(`Created user with id: ${user.id}`);
  }

  console.log('Seeding finished.');
}

main().finally(async () => {
  await prisma.$disconnect();
});
