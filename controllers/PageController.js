import prisma from "../DB/db.config.js";
import { v4 as uuidv4 } from 'uuid';

class PageController {
  static async createPage(req, res) {
    try {
        const { title, content, author, category } = req.body;

        // Validate input
        if (!title || !content || !author || !category) {
            return res.status(400).json({ error: "All fields are required" });
        }

        // Get categories from database
        const categoriesData = await prisma.categories.findMany({
          select: { name: true }
        });
        const categories = categoriesData.map(cat => cat.name);

        // Get direct pages from database
        const directPagesData = await prisma.directPages.findMany({
          select: { title: true }
        });
        const directPages = directPagesData.map(page => page.title);

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
            // Category does not exist, so add it to directPages if page title is unique
            const existingPage = await prisma.pages.findUnique({
                where: { title: title }
            });

            if (existingPage) {
                return res.status(409).json({ error: "A page with this title already exists" });
            }

            // Add the new category to DirectPages table
            await prisma.directPages.create({
              data: {
                title: category
              }
            });
        }

        // Create new page in database with content
        const newPage = await prisma.pages.create({
            data: {
                title,
                content,
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
        
        const page = await prisma.pages.findUnique({
            where: { title: title },
        });

        if (!page) {
            return res.status(404).json({ error: "Page not found" });
        }

        res.json({
            id: page.id,
            title: page.title,
            author: page.author,
            category: page.category,
            content: page.content,
        });
    } catch (error) {
        console.error("Error retrieving page:", error);
        res.status(500).json({ error: "An error occurred while retrieving the page" });
    }
  }

  static async getAllPages(req, res) {
    try {
        const { user } = req;

        let pages;

        if (user.role === 'Admin') {
            pages = await prisma.pages.findMany({
                select: {
                    title: true,
                }
            });
        } else if (user.role === 'Editor') {
            pages = await prisma.pages.findMany({
                where: { author: user.username },
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

        const updatedPage = await prisma.pages.update({
            where: { title: title },
            data: {
                content,
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

      const page = await prisma.pages.findUnique({
        where: { title: title },
      });

      if (!page) {
        return res.status(404).json({ error: "Page not found" });
      }

      // Check if title equals category and handle DirectPages table
      if (title === page.category) {
        await prisma.directPages.deleteMany({
          where: { title: title }
        });
      }

      await prisma.pages.delete({
        where: { title: title },
      });

      res.json({ message: "Page deleted successfully" });
    } catch (error) {
      console.error("Error deleting page:", error);
      res.status(500).json({ error: "An error occurred while deleting the page" });
    }
  }

  // Rest of the methods remain unchanged as they don't deal with content
  static async pagesByCategory(req, res) {
    try {
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

  static async getCategory(req, res) {
    try {
      const categoriesData = await prisma.categories.findMany({
        select: { name: true }
      });
      const categories = categoriesData.map(cat => cat.name);
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

      const existingCategory = await prisma.categories.findUnique({
        where: { name: category }
      });

      if (existingCategory) {
        return res.status(409).json({ error: 'Category already exists.' });
      }

      await prisma.categories.create({
        data: { name: category }
      });

      const allCategories = await prisma.categories.findMany({
        select: { name: true }
      });
      const categories = allCategories.map(cat => cat.name);

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
      const existingCategory = await prisma.categories.findUnique({
        where: { name: category }
      });
      
      if (!existingCategory) {
        return res.status(404).json({ error: 'Category not found.' });
      }
      
      await prisma.categories.delete({
        where: { name: category }
      });
      
      res.status(200).json({ message: 'Category deleted successfully.' });
    } catch (error) {
      console.error('Error deleting category:', error);
      res.status(500).json({ error: 'Failed to delete category.' });
    }
  }
}

export default PageController;