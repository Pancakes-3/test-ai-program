const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const delimiter = "|";
const serializeTags = (tags) => {
  if (!tags.length) return "";
  const unique = Array.from(new Set(tags));
  return `${delimiter}${unique.join(delimiter)}${delimiter}`;
};

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("Password123!", 10);

  const admin = await prisma.user.upsert({
    where: { username: "campadmin" },
    update: {},
    create: {
      username: "campadmin",
      displayName: "Camp Admin",
      role: "ADMIN",
      tags: "",
      passwordHash,
      mustChangePassword: false
    }
  });

  const president = await prisma.user.upsert({
    where: { username: "president" },
    update: {},
    create: {
      username: "president",
      displayName: "Current President",
      role: "USER",
      tags: serializeTags(["PRESIDENT", "BREAKING_NEWS"]),
      passwordHash,
      mustChangePassword: true
    }
  });

  const candidateOne = await prisma.user.upsert({
    where: { username: "candidate1" },
    update: {},
    create: {
      username: "candidate1",
      displayName: "Candidate Alex",
      role: "USER",
      tags: serializeTags(["CANDIDATE", "BREAKING_NEWS"]),
      passwordHash,
      mustChangePassword: true
    }
  });

  const candidateTwo = await prisma.user.upsert({
    where: { username: "candidate2" },
    update: {},
    create: {
      username: "candidate2",
      displayName: "Candidate Morgan",
      role: "USER",
      tags: serializeTags(["CANDIDATE", "BREAKING_NEWS"]),
      passwordHash,
      mustChangePassword: true
    }
  });

  const users = await Promise.all(
    ["sam", "riley", "jordan", "casey", "taylor"].map((username) =>
      prisma.user.upsert({
        where: { username },
        update: {},
        create: {
          username,
          displayName: username.charAt(0).toUpperCase() + username.slice(1),
          role: "USER",
          tags: "",
          passwordHash,
          mustChangePassword: true
        }
      })
    )
  );

  await prisma.follow.createMany({
    data: [
      { followerId: users[0].id, followingId: president.id },
      { followerId: users[1].id, followingId: candidateOne.id },
      { followerId: users[2].id, followingId: candidateTwo.id },
      { followerId: users[3].id, followingId: candidateOne.id },
      { followerId: users[4].id, followingId: president.id }
    ],
    skipDuplicates: true
  });

  await prisma.post.createMany({
    data: [
      {
        authorId: president.id,
        text: "Welcome to Politics Camp Social! Stay tuned for updates from the president's office."
      },
      {
        authorId: candidateOne.id,
        text: "My platform: teamwork, student engagement, and positive change across camp."
      },
      {
        authorId: candidateTwo.id,
        text: "Excited to run for president! Ask me about my ideas for camp events."
      },
      {
        authorId: users[0].id,
        text: "Does anyone want to collaborate on a debate prep session?"
      }
    ],
    skipDuplicates: true
  });

  console.log("Seed data created:");
  console.log({
    admin: admin.username,
    president: president.username,
    candidates: [candidateOne.username, candidateTwo.username]
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
