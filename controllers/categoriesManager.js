import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getCategories() {
  try {
    const categories = await prisma.categories.findMany({
      select: { name: true },
    });
    return categories.map((category) => category.name);
  } catch (error) {
    console.error('Error fetching categories from the database:', error);
    return [];
  }
}

async function saveCategories(categories) {
  try {
    // Clear existing categories and insert new ones
    await prisma.categories.deleteMany();
    const data = categories.map((name) => ({ name }));
    await prisma.categories.createMany({ data });
  } catch (error) {
    console.error('Error saving categories to the database:', error);
    throw error;
  }
}

export default { getCategories, saveCategories };
