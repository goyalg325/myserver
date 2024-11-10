import prisma from "../DB/db.config.js";
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import categoriesManager from './categoriesManager.js';

const { getCategories, saveCategories } = categoriesManager;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PageController {
  static async createPage(req, res) {
    try {
        const { title, content, author, category } = req.body;

        // Validate input
        if (!title || !content || !author || !category) {
            return res.status(400).json({ error: "All fields are required" });
        }

        // Read and parse categories.json and directpage.json
        const categoriesPath = path.join(__dirname, '..', 'categories.json');
        const directPagesPath = path.join(__dirname, '..', 'directpage.json');

        const categoriesData = JSON.parse(await fs.readFile(categoriesPath, 'utf8'));
        const categories = categoriesData.categories || [];  // Access the "categories" array directly

        const directPagesData = JSON.parse(await fs.readFile(directPagesPath, 'utf8'));
        let directPages = directPagesData.directPages || []; // Ensure it's an array

        // Check if category already exists
        const categoryExists = categories.includes(category);

        // Check if page title and category are the same
        if (categoryExists && title === category) {
            return res.status(400).json({ error: "Page title and category name can't be the same" });
        }

        // If category exists, check if a page with the same title and category exists
        if (categoryExists) {
          const existingPage = await prisma.pages.findFirst({
            where: {
                title: title
            }
        });
        

            if (existingPage) {
                return res.status(409).json({ error: "A page with this title already exists in the same category" });
            }
        } else {
            // Category does not exist, so add it to directpage.json if page title is unique
            const existingPage = await prisma.pages.findUnique({
                where: { title: title }
            });

            if (existingPage) {
                return res.status(409).json({ error: "A page with this title already exists" });
            }

            // Add the new category to directPages array and save it
            directPages.push(category);
            await fs.writeFile(directPagesPath, JSON.stringify({ directPages }, null, 2));
        }

        // Generate a unique filename
        let filename;
        let contentPath;
        let existingPagePath;
        do {
            filename = `${uuidv4()}.txt`;
            contentPath = `/content/${filename}`;
            existingPagePath = await prisma.pages.findUnique({
                where: { contentPath: contentPath }
            });
        } while (existingPagePath);

        const filePath = path.join(__dirname, '..', 'public', 'content', filename);

        // Write content to file
        await fs.writeFile(filePath, content, 'utf8');

        // Create new page in database
        const newPage = await prisma.pages.create({
            data: {
                title,
                contentPath,
                author,
                category,
            },
        });

        res.status(201).json({
            message: "Page created successfully",
            page: {
                id: newPage.id,
                title: newPage.title,
                author: newPage.author,
                category: newPage.category,
            },
        });
    } catch (error) {
        console.error("Error creating page:", error);
        res.status(500).json({ error: "An error occurred while creating the page" });
    }
}

      static async getPage(req, res) {
        try {
            const { title } = req.params;
            
            // Find the page in the database by title
            const page = await prisma.pages.findUnique({
                where: { title: title },
            });

            if (!page) {
                return res.status(404).json({ error: "Page not found" });
            }

            // Read the content from the file
            const filePath = path.join(__dirname, '..', 'public', page.contentPath);
            const content = await fs.readFile(filePath, 'utf8');

            // Return the page data and content
            res.json({
                id: page.id,
                title: page.title,
                author: page.author,
                category: page.category,
                content: content,
               });
        } catch (error) {
            console.error("Error retrieving page:", error);
            res.status(500).json({ error: "An error occurred while retrieving the page" });
        }
    }

    static async getAllPages(req, res) {
      try {
          const { user } = req; // user object is attached to the request by auth middleware

          let pages;

          if (user.role === 'Admin') {
              // Admins can see all pages
              pages = await prisma.pages.findMany({
                  select: {
                       title: true,
                   }
              });
          } else if (user.role === 'Editor') {
              // Editors can only see pages they authored
              pages = await prisma.pages.findMany({
                  where: { author: user.username }, // Assuming the author field matches the username
                  select: {
                    title: true,
                }
              });
          } else {
              return res.status(403).json({ error: "Unauthorized access" });
          }
        res.json(pages);
      } catch (error) {
          console.error("Error retrieving pages:", error);
          res.status(500).json({ error: "An error occurred while retrieving pages" });
      }
    }

    static async updatePage(req, res) {
      try {
          const { title } = req.params;
          const { content, author, category } = req.body;

          // Find the page in the database by title
          const page = await prisma.pages.findUnique({
              where: { title: title },
          });

          if (!page) {
              return res.status(404).json({ error: "Page not found" });
          }

          // Update the content in the file
          const filePath = path.join(__dirname, '..', 'public', page.contentPath);
          await fs.writeFile(filePath, content, 'utf8');

          // Update the page in the database
          const updatedPage = await prisma.pages.update({
              where: { title: title },
              data: {
                  author,
                  category,
              },
          });

          res.json({
              message: "Page updated successfully",
              page: {
                  id: updatedPage.id,
                  title: updatedPage.title,
                  author: updatedPage.author,
                  category: updatedPage.category,
              },
          });
      } catch (error) {
          console.error("Error updating page:", error);
          res.status(500).json({ error: "An error occurred while updating the page" });
      }
  }

  static async deletePage(req, res) {
    try {
      const { title } = req.params;

      // Find the page in the database by title
      const page = await prisma.pages.findUnique({
        where: { title: title },
      });

      if (!page) {
        return res.status(404).json({ error: "Page not found" });
      }

      // Check if title equals category
      if (title === page.category) {
        const directPagesPath = path.join(__dirname, '..', 'directpage.json');
        
        // Read and parse the direct pages JSON file
        const directPagesData = JSON.parse(await fs.readFile(directPagesPath, 'utf8'));
        let directPages = directPagesData.directPages || [];

        // Remove the title from the array if it exists
        directPages = directPages.filter(pageTitle => pageTitle !== title);

        // Update the direct pages JSON file
        directPagesData.directPages = directPages;
        await fs.writeFile(directPagesPath, JSON.stringify(directPagesData, null, 2));
      }

      // Delete the content file
      const filePath = path.join(__dirname, '..', 'public', page.contentPath);
      await fs.unlink(filePath);

      // Delete the page from the database
      await prisma.pages.delete({
        where: { title: title },
      });

      res.json({ message: "Page deleted successfully" });
    } catch (error) {
      console.error("Error deleting page:", error);
      res.status(500).json({ error: "An error occurred while deleting the page" });
    }
  }
  static async pagesByCategory(req, res) {
    try {
      // Fetch all pages and select only title and category fields
      const pages = await prisma.pages.findMany({
        select: {
          title: true,
          category: true,
        },
      });
  
      res.json(pages);
    } catch (error) {
      console.error("Error retrieving pages:", error);
      res.status(500).json({ error: "An error occurred while retrieving pages" });
    }
  }
  
  static async updateCategory(req, res) {
    try {
      const { title, category } = req.body;

      if (!title || !category) {
        return res.status(400).json({ error: 'Title and category are required.' });
      }

      const page = await prisma.pages.findUnique({
        where: { title },
      });

      if (!page) {
        return res.status(404).json({ error: 'Page not found.' });
      }

      const updatedPage = await prisma.pages.update({
        where: { title },
        data: {
          category,
        },
      });

      res.json({ message: 'Category updated successfully.', page: updatedPage });
    } catch (error) {
      console.error('Error updating category:', error);
      res.status(500).json({ error: 'An error occurred while updating the category.' });
    }
  }

  // static async getCategories(req, res) {
  //   try {
  //     const categoriesFilePath = path.join(__dirname, '..', 'categories.js');
  //     const categoriesModule = await import(`file://${categoriesFilePath}`);
  //     const categories = categoriesModule.default;

  //     res.json(categories);
  //   } catch (error) {
  //     console.error("Error reading categories:", error);
  //     res.status(500).json({ error: "An error occurred while reading categories." });
  //   }
  // }

  // static async addCategory(req, res) {
  //   try {
  //     const { category } = req.body;

  //     if (!category) {
  //       return res.status(400).json({ error: 'Category is required.' });
  //     }

  //     const categoriesFilePath = path.join(__dirname, '..', 'categories.js');
  //     const categoriesModule = await import(`file://${categoriesFilePath}`);
  //     const categories = categoriesModule.default;

  //     if (categories.includes(category)) {
  //       return res.status(409).json({ error: 'Category already exists.' });
  //     }

  //     categories.push(category);

  //     const newCategoriesContent = `const categories = ${JSON.stringify(categories, null, 2)};\n\nexport default categories;\n`;
  //     await fs.writeFile(categoriesFilePath, newCategoriesContent, 'utf8');

  //     res.status(201).json({ message: 'Category added successfully.', categories });
  //   } catch (error) {
  //     console.error("Error adding category:", error);
  //     res.status(500).json({ error: "An error occurred while adding the category." });
  //   }
  // }

  // static async deleteCategory(req, res) {
  //   const categoriesFilePath = path.join(__dirname, '..', 'categories.js');
  //   const { category } = req.body;
    
  //   if (!category) {
  //     return res.status(400).json({ error: 'Category name is required.' });
  //   }
    
  //   try {
  //     console.log(`Attempting to delete category: ${category}`);
  //     const categoriesModule = await import(`file://${categoriesFilePath}`);
  //     let categories = categoriesModule.default;
      
  //     console.log(`Current categories: ${JSON.stringify(categories)}`);
      
  //     if (!categories.includes(category)) {
  //       return res.status(404).json({ error: 'Category not found.' });
  //     }
      
  //     categories = categories.filter(cat => cat !== category);
  //     console.log(`Categories after deletion: ${JSON.stringify(categories)}`);
      
  //     const updatedCategories = `const categories = ${JSON.stringify(categories, null, 2)};\n\nexport default categories;\n`;
      
  //     await fs.writeFile(categoriesFilePath, updatedCategories, 'utf8');
  //     console.log(`File written successfully`);
      
  //     res.status(200).json({ message: 'Category deleted successfully.' });
  //   } catch (error) {
  //     console.error('Error deleting category:', error);
  //     res.status(500).json({ error: 'Failed to delete category.' });
  //   }
  // }
  static async getCategory(req, res) {
    try {
      const categories = await getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error reading categories:", error);
      res.status(500).json({ error: "An error occurred while reading categories." });
    }
  }

  static async addCategory(req, res) {
    try {
      const { category } = req.body;

      if (!category) {
        return res.status(400).json({ error: 'Category is required.' });
      }

      let categories = await getCategories();

      if (categories.includes(category)) {
        return res.status(409).json({ error: 'Category already exists.' });
      }

      categories.push(category);
      await saveCategories(categories);

      res.status(201).json({ message: 'Category added successfully.', categories });
    } catch (error) {
      console.error("Error adding category:", error);
      res.status(500).json({ error: "An error occurred while adding the category." });
    }
  }

  static async deleteCategory(req, res) {
    const { category } = req.body;
    
    if (!category) {
      return res.status(400).json({ error: 'Category name is required.' });
    }
    
    try {
      console.log(`Attempting to delete category: ${category}`);
      let categories = await getCategories();
      
      console.log(`Current categories: ${JSON.stringify(categories)}`);
      
      if (!categories.includes(category)) {
        return res.status(404).json({ error: 'Category not found.' });
      }
      
      categories = categories.filter(cat => cat !== category);
      console.log(`Categories after deletion: ${JSON.stringify(categories)}`);
      
      await saveCategories(categories);
      console.log(`Categories saved successfully`);
      
      res.status(200).json({ message: 'Category deleted successfully.' });
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ error: 'Failed to delete category.' });
    }
  }
}
export default PageController;



