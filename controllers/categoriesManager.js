import { promises as fs } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const categoriesFilePath = join(__dirname, '..', 'categories.json');

async function getCategories() {
  try {
    const data = await fs.readFile(categoriesFilePath, 'utf8');
    const jsonData = JSON.parse(data);
    return jsonData.categories;
  } catch (error) {
    console.error('Error reading categories:', error);
    return [];
  }
}

async function saveCategories(categories) {
  try {
    const data = JSON.stringify({ categories }, null, 2);
    await fs.writeFile(categoriesFilePath, data, 'utf8');
  } catch (error) {
    console.error('Error saving categories:', error);
    throw error;
  }
}

export default { getCategories, saveCategories };
