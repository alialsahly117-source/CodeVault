import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

async function main() {
  const categoryNames: Array<[string, "PROGRAMMING" | "AI" | "PROMPT_TYPE" | "GENERAL"]> = [
    ["JavaScript", "PROGRAMMING"],
    ["TypeScript", "PROGRAMMING"],
    ["Python", "PROGRAMMING"],
    ["React", "PROGRAMMING"],
    ["Next.js", "PROGRAMMING"],
    ["Flutter", "PROGRAMMING"],
    ["SQL", "PROGRAMMING"],
    ["CSS", "PROGRAMMING"],
    ["AI", "AI"],
    ["ChatGPT", "AI"],
    ["Gemini", "AI"],
    ["Claude", "AI"],
    ["Coding", "PROMPT_TYPE"],
    ["Marketing", "PROMPT_TYPE"],
    ["Automation", "PROMPT_TYPE"],
  ];

  const categories = await Promise.all(
    categoryNames.map(([name, type]) =>
      prisma.category.upsert({
        where: { slug: slug(name) },
        update: {},
        create: { name, slug: slug(name), type },
      })
    )
  );
  const catByName = Object.fromEntries(categories.map((c) => [c.name, c]));

  const adminPassword = await bcrypt.hash("Admin@12345", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@codevault.dev" },
    update: {},
    create: {
      email: "admin@codevault.dev",
      passwordHash: adminPassword,
      role: "ADMIN",
      profile: { create: { displayName: "مشرف CodeVault" } },
    },
  });

  const demoPassword = await bcrypt.hash("Demo@12345", 12);
  const demoUser = await prisma.user.upsert({
    where: { email: "demo@codevault.dev" },
    update: {},
    create: {
      email: "demo@codevault.dev",
      passwordHash: demoPassword,
      role: "USER",
      profile: { create: { displayName: "مطور تجريبي" } },
    },
  });

  const moderatorPassword = await bcrypt.hash("Mod@12345", 12);
  await prisma.user.upsert({
    where: { email: "moderator@codevault.dev" },
    update: {},
    create: {
      email: "moderator@codevault.dev",
      passwordHash: moderatorPassword,
      role: "MODERATOR",
      profile: { create: { displayName: "مشرف مراجعة" } },
    },
  });

  const editorPassword = await bcrypt.hash("Editor@12345", 12);
  await prisma.user.upsert({
    where: { email: "editor@codevault.dev" },
    update: {},
    create: {
      email: "editor@codevault.dev",
      passwordHash: editorPassword,
      role: "EDITOR",
      profile: { create: { displayName: "محرر محتوى" } },
    },
  });

  await prisma.setting.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });

  const codesSeed = [
    {
      title: "JWT Authentication Middleware",
      description: "Middleware جاهز للتحقق من JWT Authentication في Express.",
      language: "JavaScript",
      framework: "Node.js",
      category: "JavaScript",
      tags: ["JavaScript", "Node.js", "Authentication"],
      content: `function authMiddleware(req, res, next) {\n  const token = req.headers.authorization?.split(" ")[1];\n  if (!token) return res.status(401).json({ error: "Unauthorized" });\n  try {\n    req.user = jwt.verify(token, process.env.JWT_SECRET);\n    next();\n  } catch {\n    res.status(401).json({ error: "Invalid token" });\n  }\n}`,
    },
    {
      title: "React Custom Hook: useDebounce",
      description: "Hook جاهز لتأخير تنفيذ القيمة، مفيد لحقول البحث.",
      language: "TypeScript",
      framework: "React",
      category: "React",
      tags: ["React", "TypeScript", "Hooks"],
      content: `import { useEffect, useState } from "react";\n\nexport function useDebounce<T>(value: T, delay = 300): T {\n  const [debounced, setDebounced] = useState(value);\n  useEffect(() => {\n    const timer = setTimeout(() => setDebounced(value), delay);\n    return () => clearTimeout(timer);\n  }, [value, delay]);\n  return debounced;\n}`,
    },
    {
      title: "Python FastAPI Pagination Helper",
      description: "دالة جاهزة لتطبيق Pagination في FastAPI مع SQLAlchemy.",
      language: "Python",
      framework: "FastAPI",
      category: "Python",
      tags: ["Python", "FastAPI", "SQL"],
      content: `def paginate(query, page: int = 1, limit: int = 20):\n    return query.offset((page - 1) * limit).limit(limit)`,
    },
  ];

  for (const c of codesSeed) {
    await prisma.code.create({
      data: {
        title: c.title,
        description: c.description,
        content: c.content,
        language: c.language,
        framework: c.framework,
        authorId: demoUser.id,
        categoryId: catByName[c.category]?.id,
        copyCount: Math.floor(Math.random() * 5000),
        likeCount: Math.floor(Math.random() * 500),
        tags: {
          create: await Promise.all(
            c.tags.map(async (t) => ({
              tag: {
                connectOrCreate: {
                  where: { name: t },
                  create: { name: t, slug: slug(t) },
                },
              },
            }))
          ),
        },
      },
    });
  }

  const promptsSeed = [
    {
      title: "Senior Code Reviewer Prompt",
      description: "برومبت لجعل النموذج يراجع الكود كمهندس برمجيات خبير.",
      aiModel: "Claude",
      category: "Coding",
      tags: ["Coding", "Review"],
      content: `You are an expert {{ROLE}}.\n\nYour task is to {{TASK}}.\n\nRequirements:\n{{REQUIREMENTS}}\n\nOutput format:\n{{OUTPUT_FORMAT}}`,
      variables: [
        { key: "ROLE", label: "الدور", defaultValue: "senior software engineer" },
        { key: "TASK", label: "المهمة", defaultValue: "review this pull request for bugs and readability" },
        { key: "REQUIREMENTS", label: "المتطلبات", defaultValue: "- Point out security issues\n- Suggest simpler alternatives" },
        { key: "OUTPUT_FORMAT", label: "صيغة المخرجات", defaultValue: "A bullet list ordered by severity" },
      ],
    },
    {
      title: "Marketing Copy Generator",
      description: "برومبت لإنشاء نصوص تسويقية جذابة لمنتج معين.",
      aiModel: "ChatGPT",
      category: "Marketing",
      tags: ["Marketing", "Copywriting"],
      content: `You are an expert {{ROLE}}.\n\nYour task is to {{TASK}}.\n\nRequirements:\n{{REQUIREMENTS}}\n\nOutput format:\n{{OUTPUT_FORMAT}}`,
      variables: [
        { key: "ROLE", label: "الدور", defaultValue: "marketing copywriter" },
        { key: "TASK", label: "المهمة", defaultValue: "write a landing page hero section" },
        { key: "REQUIREMENTS", label: "المتطلبات", defaultValue: "- Persuasive tone\n- Under 40 words" },
        { key: "OUTPUT_FORMAT", label: "صيغة المخرجات", defaultValue: "Title + subtitle" },
      ],
    },
  ];

  for (const p of promptsSeed) {
    await prisma.prompt.create({
      data: {
        title: p.title,
        description: p.description,
        content: p.content,
        aiModel: p.aiModel,
        variables: p.variables,
        authorId: admin.id,
        categoryId: catByName[p.category]?.id,
        copyCount: Math.floor(Math.random() * 5000),
        likeCount: Math.floor(Math.random() * 500),
        tags: {
          create: await Promise.all(
            p.tags.map(async (t) => ({
              tag: {
                connectOrCreate: {
                  where: { name: t },
                  create: { name: t, slug: slug(t) },
                },
              },
            }))
          ),
        },
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log(
    "تم إدخال بيانات تجريبية:\n" +
      "  admin@codevault.dev / Admin@12345 (ADMIN)\n" +
      "  moderator@codevault.dev / Mod@12345 (MODERATOR)\n" +
      "  editor@codevault.dev / Editor@12345 (EDITOR)\n" +
      "  demo@codevault.dev / Demo@12345 (USER)"
  );
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
