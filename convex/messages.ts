import { v } from "convex/values";
import { mutation, query, QueryCtx } from "./_generated/server";
import { getCurrentUserOrThrow } from "./users";
import { paginationOptsValidator } from "convex/server";
import { Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";

export const addThreadMessage = mutation({
  args: {
    content: v.string(),
    mediaFiles: v.optional(v.array(v.string())),
    websiteUrl: v.optional(v.string()),
    threadId: v.optional(v.id("messages")),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx);

    const message = await ctx.db.insert("messages", {
      ...args,
      userId: user._id,
      likeCount: 0,
      commentCount: 0,
      retweetCount: 0,
    });

    if (args.threadId) {
      const originalThread = await ctx.db.get(args.threadId);
      await ctx.db.patch(args.threadId, {
        commentCount: (originalThread?.commentCount || 0) + 1,
      });

      if (originalThread?.userId !== user._id) {
        const user = await ctx.db.get(originalThread?.userId as Id<"users">);
        const pushToken = user?.pushToken;

        if (!pushToken) return;

        await ctx.scheduler.runAfter(5000, internal.push.sendPushNotification, {
          pushToken,
          threadId: args.threadId,
          messageTitle: "New comment",
          messageBody: args.content,
        });
      }
    }

    return message;
  },
});

export const getThreads = query({
  args: {
    paginationOpts: paginationOptsValidator,
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let threads;

    if (args.userId) {
      threads = await ctx.db
        .query("messages")
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .order("desc")
        .paginate(args.paginationOpts);
    } else {
      threads = await ctx.db
        .query("messages")
        .filter((q) => q.eq(q.field("threadId"), undefined))
        .order("desc")
        .paginate(args.paginationOpts);
    }

    const messagesWithCreator = await Promise.all(
      threads.page.map(async (thread) => {
        const creator = await getMessageCreator(ctx, thread.userId);
        const mediaUrls = await getMediaUrls(ctx, thread.mediaFiles);

        return {
          ...thread,
          creator,
          mediaFiles: mediaUrls,
        };
      })
    );

    return {
      ...threads,
      page: messagesWithCreator,
    };
  },
});

export const likeThread = mutation({
  args: { threadId: v.id("messages") },
  handler: async (ctx, args) => {
    await getCurrentUserOrThrow(ctx);

    const message = await ctx.db.get(args.threadId);

    await ctx.db.patch(args.threadId, {
      likeCount: (message?.likeCount || 0) + 1,
    });
  },
});

export const getThreadById = query({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) return null;

    const creator = await getMessageCreator(ctx, message.userId);
    const mediaUrls = await getMediaUrls(ctx, message.mediaFiles);

    return {
      ...message,
      mediaFiles: mediaUrls,
      creator,
    };
  },
});

export const getThreadComments = query({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    const comments = await ctx.db
      .query("messages")
      .filter((q) => q.eq(q.field("threadId"), args.messageId))
      .order("desc")
      .collect();

    const messagesWithCreator = await Promise.all(
      comments.map(async (comment) => {
        const creator = await getMessageCreator(ctx, comment.userId);
        const mediaUrls = await getMediaUrls(ctx, comment.mediaFiles);

        return {
          ...comment,
          creator,
          mediaFiles: mediaUrls,
        };
      })
    );

    return messagesWithCreator;
  },
});

const getMessageCreator = async (ctx: QueryCtx, userId: Id<"users">) => {
  const user = await ctx.db.get(userId);

  if (!user?.imageUrl || user.imageUrl.startsWith("http")) {
    return user;
  }

  const imageUrl = await ctx.storage.getUrl(user.imageUrl as Id<"_storage">);
  return { ...user, imageUrl };
};

const getMediaUrls = async (
  ctx: QueryCtx,
  mediaFiles: string[] | undefined
) => {
  if (!mediaFiles || mediaFiles.length == 0) {
    return [];
  }

  const urlPromise = mediaFiles.map((file) =>
    ctx.storage.getUrl(file as Id<"_storage">)
  );
  const results = await Promise.allSettled(urlPromise);

  return results
    .filter(
      (result): result is PromiseFulfilledResult<string> =>
        result.status === "fulfilled"
    )
    .map((result) => result.value);
};

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    await getCurrentUserOrThrow(ctx);

    return await ctx.storage.generateUploadUrl();
  },
});
