const express = require('express')
const app = express()
app.use(express.json())
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const bcrypt = require('bcrypt')
const path = require('path')
const jwt = require('jsonwebtoken')
const dbPath = path.join(__dirname, 'twitterClone.db')
let db = null

const fun = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000)
  } catch (e) {
    console.log(`DB error : ${e.message}`)
    process.exit(1)
  }
}
fun()

app.post('/register/', async (request, response) => {
  const {username, password, name, gender} = request.body
  const userQuery = `SELECT * FROM user WHERE username = '${username}';`
  const userObj = await db.get(userQuery)
  if (userObj !== undefined) {
    response.status(400)
    response.send('User already exists')
  } else {
    if (password.length < 6) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const hashedPass = await bcrypt.hash(password, 10)
      const createQuery = `
        INSERT INTO user (name, username, password, gender)
        VALUES ('${name}', '${username}', '${hashedPass}', '${gender}');
      `
      await db.run(createQuery)
      response.send('User created successfully')
    }
  }
})

app.post('/login/', async (request, response) => {
  const {username, password} = request.body
  const userQuery = `SELECT * FROM user WHERE username = '${username}';`
  const userObj = await db.get(userQuery)
  if (userObj === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isValid = await bcrypt.compare(password, userObj.password)
    if (isValid) {
      const payload = {username}
      const jwtToken = jwt.sign(payload, 'MY_SECRET_TOKEN')
      response.send({jwtToken})
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

const authenticate = (request, response, next) => {
  const authHeader = request.headers['authorization']
  let jwtToken
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1]
  }
  if (jwtToken === undefined) {
    response.status(401)
    response.send('Invalid JWT Token')
  } else {
    jwt.verify(jwtToken, 'MY_SECRET_TOKEN', (error, payload) => {
      if (error) {
        response.status(401)
        response.send('Invalid JWT Token')
      } else {
        request.username = payload.username
        next()
      }
    })
  }
}

app.get('/user/tweets/feed/', authenticate, async (request, response) => {
  const {username} = request
  const query = `
    SELECT 
      user.username AS username,
      tweet.tweet,
      tweet.date_time AS dateTime
    FROM follower
    INNER JOIN user ON follower.following_user_id = user.user_id
    INNER JOIN tweet ON tweet.user_id = follower.following_user_id
    WHERE follower.follower_user_id = (
      SELECT user_id FROM user WHERE username = '${username}'
    )
    ORDER BY tweet.date_time DESC
    LIMIT 4;
  `
  const result = await db.all(query)
  response.send(result)
})

app.get('/user/following/', authenticate, async (request, response) => {
  const {username} = request
  const query = `
    SELECT name FROM user
    WHERE user_id IN (
      SELECT following_user_id FROM follower
      WHERE follower_user_id = (
        SELECT user_id FROM user WHERE username = '${username}'
      )
    );
  `
  const result = await db.all(query)
  response.send(result)
})

app.get('/user/followers/', authenticate, async (request, response) => {
  const {username} = request
  const query = `
    SELECT name FROM user
    WHERE user_id IN (
      SELECT follower_user_id FROM follower
      WHERE following_user_id = (
        SELECT user_id FROM user WHERE username = '${username}'
      )
    );
  `
  const result = await db.all(query)
  response.send(result)
})

app.get('/tweets/:tweetId/', authenticate, async (request, response) => {
  const {tweetId} = request.params
  const {username} = request
  const userIdQuery = `SELECT user_id FROM user WHERE username = '${username}';`
  const user = await db.get(userIdQuery)
  const accessQuery = `
    SELECT * FROM tweet
    WHERE tweet_id = ${tweetId}
    AND user_id IN (
      SELECT following_user_id FROM follower WHERE follower_user_id = ${user.user_id}
    );
  `
  const tweet = await db.get(accessQuery)
  if (tweet === undefined) {
    response.status(401)
    response.send('Invalid Request')
  } else {
    const query = `
      SELECT 
        tweet,
        (SELECT COUNT(*) FROM like WHERE tweet_id = ${tweetId}) AS likes,
        (SELECT COUNT(*) FROM reply WHERE tweet_id = ${tweetId}) AS replies,
        date_time AS dateTime
      FROM tweet
      WHERE tweet_id = ${tweetId};
    `
    const result = await db.get(query)
    response.send(result)
  }
})

app.get('/tweets/:tweetId/likes/', authenticate, async (request, response) => {
  const {tweetId} = request.params
  const {username} = request
  const userIdQuery = `SELECT user_id FROM user WHERE username = '${username}';`
  const user = await db.get(userIdQuery)
  const accessQuery = `
    SELECT * FROM tweet
    WHERE tweet_id = ${tweetId}
    AND user_id IN (
      SELECT following_user_id FROM follower WHERE follower_user_id = ${user.user_id}
    );
  `
  const tweet = await db.get(accessQuery)
  if (tweet === undefined) {
    response.status(401)
    response.send('Invalid Request')
  } else {
    const query = `
      SELECT username FROM user
      WHERE user_id IN (
        SELECT user_id FROM like WHERE tweet_id = ${tweetId}
      );
    `
    const result = await db.all(query)
    response.send({likes: result.map(user => user.username)})
  }
})

app.get(
  '/tweets/:tweetId/replies/',
  authenticate,
  async (request, response) => {
    const {tweetId} = request.params
    const {username} = request
    const userIdQuery = `SELECT user_id FROM user WHERE username = '${username}';`
    const user = await db.get(userIdQuery)
    const accessQuery = `
    SELECT * FROM tweet
    WHERE tweet_id = ${tweetId}
    AND user_id IN (
      SELECT following_user_id FROM follower WHERE follower_user_id = ${user.user_id}
    );
  `
    const tweet = await db.get(accessQuery)
    if (tweet === undefined) {
      response.status(401)
      response.send('Invalid Request')
    } else {
      const query = `
      SELECT user.name, reply FROM reply
      INNER JOIN user ON reply.user_id = user.user_id
      WHERE tweet_id = ${tweetId};
    `
      const result = await db.all(query)
      response.send({replies: result})
    }
  },
)

app.get('/user/tweets/', authenticate, async (request, response) => {
  const {username} = request
  const userIdQuery = `SELECT user_id FROM user WHERE username = '${username}';`
  const user = await db.get(userIdQuery)
  const query = `
    SELECT 
      tweet,
      date_time AS dateTime,
      COUNT(DISTINCT like.like_id) AS likes,
      COUNT(DISTINCT reply.reply_id) AS replies
    FROM tweet
    LEFT JOIN like ON tweet.tweet_id = like.tweet_id
    LEFT JOIN reply ON tweet.tweet_id = reply.tweet_id
    WHERE tweet.user_id = ${user.user_id}
    GROUP BY tweet.tweet_id;
  `
  const result = await db.all(query)
  response.send(result)
})

app.post('/user/tweets/', authenticate, async (request, response) => {
  const {tweet} = request.body
  const {username} = request
  const userIdQuery = `SELECT user_id FROM user WHERE username = '${username}';`
  const user = await db.get(userIdQuery)
  const query = `
    INSERT INTO tweet (tweet, user_id)
    VALUES ('${tweet}', ${user.user_id});
  `
  await db.run(query)
  response.send('Created a Tweet')
})

app.delete('/tweets/:tweetId/', authenticate, async (request, response) => {
  const {tweetId} = request.params
  const {username} = request
  const userIdQuery = `SELECT user_id FROM user WHERE username = '${username}';`
  const user = await db.get(userIdQuery)
  const query = `
    SELECT * FROM tweet
    WHERE tweet_id = ${tweetId} AND user_id = ${user.user_id};
  `
  const tweet = await db.get(query)
  if (tweet === undefined) {
    response.status(401)
    response.send('Invalid Request')
  } else {
    const deleteQuery = `DELETE FROM tweet WHERE tweet_id = ${tweetId};`
    await db.run(deleteQuery)
    response.send('Tweet Removed')
  }
})

module.exports = app
