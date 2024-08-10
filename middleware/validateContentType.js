const validateContentType = (req, res, next) => {
    const { content } = req.body;
    
    // Check if content is a string
    if (typeof content !== 'string') {
      return res.status(400).json({ error: "Content must be a string" });
    }
  
    // Check content length
    if (content.length > 10 * 1024 * 1024) { // 10 MB limit
      return res.status(400).json({ error: "Content exceeds maximum allowed length" });
    }
  
    // You can add more content validation here if needed
    // For example, check for malicious scripts or unwanted HTML tags
  
    next();
  };
  
  export default validateContentType;