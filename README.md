
# 🐦 Twitter Distributed System Engine (Backend)

Developed a high-performance Twitter-clone API using **Node.js** and **Express**, featuring a robust relational schema in **SQLite** to manage complex social graphs and real-time activity feeds. I engineered a secure, stateless authentication system using **JWTs** and **Bcrypt** hashing, while optimizing data retrieval through advanced SQL joins and subqueries to deliver aggregated engagement metrics with high efficiency.

---

## 🚀 Key Engineering Highlights

* **Relational Social Graph**: Designed a normalized database schema to manage many-to-many follower relationships, ensuring data integrity across `User`, `Follower`, `Tweet`, `Like`, and `Reply` tables.
* **Stateless Security Architecture**: Implemented **JWT (JSON Web Tokens)** for session management and **Bcrypt** for salted password hashing, protecting user credentials and enabling horizontal scalability.
* **Performance Optimized Queries**: Utilized advanced SQL techniques including **Internal/Left Joins**, **Subqueries**, and **Aggregate Functions** to fetch real-time engagement counts (likes/replies) in minimal database round-trips.
* **Middleware-Driven Pipeline**: Engineered custom authentication middleware to enforce **RBAC (Role-Based Access Control)**, ensuring users can only interact with content within their verified social circle.

---

## 📊 API Architecture

### **Authentication**
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/register/` | POST | New user onboarding with password length validation. |
| `/login/` | POST | Identity verification and JWT token generation. |

### **Social Graph & Discovery**
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/user/tweets/feed/` | GET | Aggregates the latest 4 tweets from people the user follows. |
| `/user/following/` | GET | Returns a list of users the current user follows. |
| `/user/followers/` | GET | Returns a list of users following the current user. |

### **Content Engagement**
| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/tweets/:tweetId/` | GET | Returns tweet details with aggregated likes and replies. |
| `/tweets/:tweetId/likes/` | GET | Fetches usernames who liked a tweet (Follower-restricted). |
| `/user/tweets/` | POST | Creates and persists a new tweet entry. |
| `/tweets/:tweetId/` | DELETE | Verified owner-only removal of content. |

---

## 🛠 Tech Stack
* **Backend**: Node.js, Express.js
* **Database**: SQLite (Relational Design)
* **Security**: JWT (Authorization), Bcrypt (Hashing)
* **Environment**: CommonJS, RESTful API Standards

---

## ⚙️ Installation & Setup
1. **Clone the repository**:
   ```bash
   git clone [https://github.com/saikumarbulasala/twitter-clone-backend.git](https://github.com/saikumarbulasala/twitter-clone-backend.git)
