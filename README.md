# Kashida: A Calligraphy Community Mobile App

Kashida is an innovative mobile application designed to connect and empower the Arabic calligraphy community by providing resources, mentorship, and networking opportunities. Inspired by the Kashida technique in Arabic script, the app extends resources and connections to enthusiasts and professionals alike.

---

## Key Features

1. **Visual Feed**
   - A Pinterest-style feed showcasing high-quality calligraphy artworks.

2. **Learning Roadmaps**
   - Step-by-step guidance for mastering scripts like Ruq’ah, Diwani, and Thuluth.

3. **Mentorship Opportunities**
   - Connect with experienced calligraphy masters for personalized feedback.

4. **Community Engagement**
   - Like, comment, and discuss artworks within a supportive community.

5. **Resources Library**
   - Curated tools, practice sheets, and learning materials.

6. **Profile Management**
   - Showcase your work, track your achievements, and interact with peers.

---

## Tech Stack

**Backend**
- Node.js
- Express.js
- MongoDB (Mongoose)

**Frontend**
- React Native
- Expo

**Utilities**
- **Cloudinary:** Image and video management.
- **Multer:** Middleware for handling file uploads.
- **Brevo (formerly Sendinblue):** Email communication.
- **JWT:** Secure authentication.
- **Bcrypt:** Password hashing.

**Security**
- Helmet, XSS-Clean, HPP for enhanced protection.
- Express-Rate-Limit to prevent abuse.

---

## Database Design

### Schema Overview
Kashida uses a normalized schema design for scalability and performance. Key models include:

- **User**: Stores user information, including profile details, followers, and joined spaces.
- **Post**: Represents user-created posts, including content and associated likes.
- **Comment**: Manages comments on posts with optional images.
- **Reply**: Tracks replies to comments.
- **Follow**: Handles user relationships.
- **Likes**: Separate schemas for posts, comments, and replies to ensure scalability.

### Example Schema: User
```javascript
const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  joinedSpaces: [{ type: mongoose.Schema.ObjectId, ref: 'Category' }],
});
```

### Referencing vs. Embedding

**Why Referencing?**
- Optimized performance by avoiding large embedded arrays.
- Simplifies relationship handling (e.g., user follows, likes).
- Flexible and scalable for growing datasets.

---

## Controllers

### Modular Design
Controllers manage application logic and ensure seamless interaction between the frontend and the database.

#### Example: Post Controller
- **Create Post**
   ```javascript
   exports.createPost = catchAsync(async (req, res, next) => {
     const post = await Post.create(req.body);
     res.status(201).json({ status: 'success', data: { post } });
   });
   ```
- **Like Post**
   Handles user likes with a dedicated PostLikes schema for scalability.

### Global Error Handler
Centralized error handling ensures consistent responses across all endpoints.

---

## Routes

### Organized Structure
Routes are divided by functionality:
- `/api/users`: User management (signup, login, profile updates).
- `/api/posts`: Post creation, retrieval, updates, and deletion.
- `/api/comments`: Comment and reply management.
- `/api/likes`: Like/unlike actions for posts, comments, and replies.
- `/api/follow`: Manage follow relationships.

### Example Route
```javascript
const postRouter = express.Router();
postRouter.route('/').get(postController.getAllPosts).post(authController.protect, postController.createPost);
```

---

## Utility Functions

### Key Utilities

1. **catchAsync**
   - Simplifies error handling in asynchronous functions.
2. **AppError**
   - Custom error class for consistent error management.
3. **APIFeatures**
   - Enables filtering, sorting, pagination, and more for API responses.
4. **Cloudinary Configuration**
   - Handles efficient image uploads and deletions.

---

## Performance Optimization

- **Normalization**: Separate schemas for relationships and interactions.
- **Pagination**: Efficient data retrieval for large datasets.
- **Caching**: Reduced redundant queries.
- **Middleware**: Pre-validation for routes to reduce load on controllers.

---

## Examples

### Create a New Post
**Endpoint:** `POST /api/posts`
```json
{
  "title": "Mastering Thuluth Script",
  "description": "Step-by-step guide",
  "categories": ["Thuluth"]
}
```

### Like a Post
**Endpoint:** `POST /api/likes/likePost`
```json
{
  "postId": "63e3c9b4f0"
}

**Response:**
{
  "status": "success",
  "message": "Post liked successfully."
}
```

---

## License

[MIT](https://github.com/Abdelrahman-7z7/kashida-app/blob/main/LICENSE)

