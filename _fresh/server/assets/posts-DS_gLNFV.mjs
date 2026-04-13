import { g as getKv, o as generateId, p as invertTimestamp } from "../server-entry.mjs";
async function createPost(title, content, authorId, authorName, boardSlug) {
  const kv = await getKv();
  const id = generateId();
  const now = Date.now();
  const invertedTime = invertTimestamp(now);
  const post = {
    id,
    title,
    content,
    authorId,
    authorName,
    boardSlug,
    createdAt: now,
    lastReplyAt: now,
    replyCount: 0,
    likeCount: 0
  };
  const boardEntry = await kv.get(["boards", boardSlug]);
  const currentCount = boardEntry.value?.postCount || 0;
  await kv.atomic().set(["posts", id], post).set(["posts_by_board", boardSlug, invertedTime, id], id).set(["posts_by_user", authorId, invertedTime, id], id).set(["posts_latest", invertedTime, id], id).commit();
  if (boardEntry.value) {
    const updatedBoard = {
      ...boardEntry.value,
      postCount: currentCount + 1
    };
    await kv.set(["boards", boardSlug], updatedBoard);
  }
  await indexPost(id, title, boardSlug, now);
  return post;
}
async function getPost(id) {
  const kv = await getKv();
  const entry = await kv.get(["posts", id]);
  return entry.value;
}
async function deletePost(id) {
  const kv = await getKv();
  const postEntry = await kv.get(["posts", id]);
  if (!postEntry.value) return false;
  const post = postEntry.value;
  const invertedCreated = invertTimestamp(post.lastReplyAt);
  await kv.atomic().delete(["posts", id]).delete(["posts_by_board", post.boardSlug, invertedCreated, id]).delete(["posts_by_user", post.authorId, invertTimestamp(post.createdAt), id]).delete(["posts_latest", invertedCreated, id]).commit();
  return true;
}
async function createReply(postId, content, authorId, authorName) {
  const kv = await getKv();
  const postEntry = await kv.get(["posts", postId]);
  if (!postEntry.value) return null;
  const post = postEntry.value;
  const id = generateId();
  const now = Date.now();
  const oldInvertedTime = invertTimestamp(post.lastReplyAt);
  const newInvertedTime = invertTimestamp(now);
  const reply = {
    id,
    postId,
    content,
    authorId,
    authorName,
    createdAt: now
  };
  const updatedPost = {
    ...post,
    replyCount: post.replyCount + 1,
    lastReplyAt: now
  };
  await kv.atomic().set(["replies", postId, id], reply).set(["replies_by_user", authorId, invertTimestamp(now)], {
    postId,
    replyId: id
  }).set(["posts", postId], updatedPost).delete(["posts_by_board", post.boardSlug, oldInvertedTime, postId]).set(["posts_by_board", post.boardSlug, newInvertedTime, postId], postId).delete(["posts_latest", oldInvertedTime, postId]).set(["posts_latest", newInvertedTime, postId], postId).commit();
  return reply;
}
async function getReplies(postId, cursor, limit = 20) {
  const kv = await getKv();
  const entries = kv.list({
    prefix: ["replies", postId]
  }, {
    limit: limit + 1,
    cursor
  });
  const items = [];
  let nextCursor;
  let count = 0;
  for await (const entry of entries) {
    count++;
    if (count > limit) break;
    items.push(entry.value);
    nextCursor = entries.cursor;
  }
  return {
    items,
    cursor: count > limit ? nextCursor : void 0,
    hasMore: count > limit
  };
}
async function toggleLike(postId, userId) {
  const kv = await getKv();
  const likeKey = ["likes", postId, userId];
  const existing = await kv.get(likeKey);
  const postEntry = await kv.get(["posts", postId]);
  if (!postEntry.value) return false;
  const post = postEntry.value;
  if (existing.value) {
    await kv.atomic().delete(likeKey).delete(["likes_by_user", userId, postId]).set(["posts", postId], {
      ...post,
      likeCount: Math.max(0, post.likeCount - 1)
    }).commit();
    return false;
  } else {
    await kv.atomic().set(likeKey, true).set(["likes_by_user", userId, postId], true).set(["posts", postId], {
      ...post,
      likeCount: post.likeCount + 1
    }).commit();
    return true;
  }
}
async function isLiked(postId, userId) {
  const kv = await getKv();
  const entry = await kv.get(["likes", postId, userId]);
  return !!entry.value;
}
async function toggleFavorite(postId, userId) {
  const kv = await getKv();
  const favKey = ["favorites", userId, postId];
  const existing = await kv.get(favKey);
  if (existing.value) {
    await kv.atomic().delete(favKey).delete(["favorites_by_post", postId, userId]).commit();
    return false;
  } else {
    await kv.atomic().set(favKey, true).set(["favorites_by_post", postId, userId], true).commit();
    return true;
  }
}
async function isFavorited(postId, userId) {
  const kv = await getKv();
  const entry = await kv.get(["favorites", userId, postId]);
  return !!entry.value;
}
async function getUserFavorites(userId, cursor, limit = 20) {
  const kv = await getKv();
  const entries = kv.list({
    prefix: ["favorites", userId]
  }, {
    limit: limit + 1,
    cursor
  });
  const posts = [];
  let nextCursor;
  let count = 0;
  for await (const entry of entries) {
    count++;
    if (count > limit) break;
    const postId = entry.key[2];
    const postEntry = await kv.get(["posts", postId]);
    if (postEntry.value) {
      posts.push(postEntry.value);
    }
    nextCursor = entries.cursor;
  }
  return {
    items: posts,
    cursor: count > limit ? nextCursor : void 0,
    hasMore: count > limit
  };
}
async function indexPost(postId, title, boardSlug, createdAt) {
  const kv = await getKv();
  const words = tokenize(title);
  const ops = kv.atomic();
  for (const word of words) {
    ops.set(["search_words", word, postId], {
      title,
      boardSlug,
      createdAt
    });
  }
  await ops.commit();
}
function tokenize(text) {
  const words = /* @__PURE__ */ new Set();
  const lower = text.toLowerCase().trim();
  const enWords = lower.match(/[a-zA-Z0-9][-a-zA-Z0-9]*/g) || [];
  for (const w of enWords) {
    if (w.length >= 2) {
      words.add(w);
      if (w.length > 4) words.add(w.substring(0, 4));
    }
  }
  const cnChars = lower.match(/[\u4e00-\u9fa5]/g) || [];
  for (const ch of cnChars) {
    words.add(ch);
  }
  for (let i = 0; i < cnChars.length - 1; i++) {
    words.add(cnChars[i] + cnChars[i + 1]);
  }
  for (let i = 0; i < cnChars.length - 2; i++) {
    words.add(cnChars[i] + cnChars[i + 1] + cnChars[i + 2]);
  }
  return Array.from(words);
}
async function searchPosts(query, limit = 30) {
  const kv = await getKv();
  const words = tokenize(query);
  if (words.length === 0) return [];
  const postScores = /* @__PURE__ */ new Map();
  for (const word of words) {
    const entries = kv.list({
      prefix: ["search_words", word]
    }, {
      limit: 50
    });
    for await (const entry of entries) {
      const postId = entry.key[2];
      postScores.set(postId, (postScores.get(postId) || 0) + 1);
    }
  }
  if (postScores.size === 0) return [];
  const sortedIds = Array.from(postScores.entries()).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([id]) => id);
  const posts = [];
  for (const postId of sortedIds) {
    const postEntry = await kv.get(["posts", postId]);
    if (postEntry.value) posts.push(postEntry.value);
  }
  return posts;
}
export {
  getReplies as a,
  isFavorited as b,
  createPost as c,
  createReply as d,
  getUserFavorites as e,
  deletePost as f,
  getPost as g,
  toggleLike as h,
  isLiked as i,
  searchPosts as s,
  toggleFavorite as t
};
