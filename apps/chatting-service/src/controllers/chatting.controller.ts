// we also need rest api for:
// for getting user and seller messages, for fetching user and seller messages on reload

import {
  AuthError,
  NotFoundError,
  ValidationError,
} from "@packages/error-handler";
import prisma from "@packages/libs/prisma";
import redis from "@packages/libs/redis";
import {
  clearUnseenCount,
  getUnseenCount,
} from "@packages/libs/redis/message.redis";
import { NextFunction, Response } from "express";

// create a new conversation
export const newConversation = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    // sellerId comes from the request body.
    // userId comes from the logged-in user (req.user.id → usually filled by an auth middleware).
    const { sellerId } = req.body;
    const userId = req.user.id;

    // If the client didn’t send sellerId, it throws a ValidationError.
    if (!sellerId) {
      return next(new ValidationError("Seller Id is required!"));
    }

    // directly check if a conversationGroup already exists for this user or not
    // It checks if a conversation already exists between this userId and sellerId.
    // isGroup: false → means this is a one-to-one chat, not a group chat.
    // participantIds: { hasEvery: [userId, sellerId] } → makes sure both IDs are inside the participants array.
    const existingGroup = await prisma.conversationGroup.findFirst({
      where: {
        isGroup: false,
        participantIds: {
          hasEvery: [userId, sellerId],
        },
      },
    });

    // if conversation already exists: It just returns that conversation and marks it as not new.
    if (existingGroup) {
      return res
        .status(200)
        .json({ conversation: existingGroup, isNew: false });
    }

    // create a new conversation + partipants
    // creating new conversation group,If no existing chat was found, it creates a new conversation group with the two participants.
    const newGroup = await prisma.conversationGroup.create({
      data: {
        isGroup: false,
        creatorId: userId,
        participantIds: [userId, sellerId],
      },
    });

    // when we create a converstions there are 2 participants, hence create those 2 participants as well
    // After creating the conversation group, it also creates participant records in the participant table.
    // Each participant (user & seller) gets linked to that conversation.
    await prisma.participant.createMany({
      data: [
        {
          conversationId: newGroup.id,
          userId,
        },
        {
          conversationId: newGroup.id,
          sellerId,
        },
      ],
    });
    // Finally, returns the new conversation with isNew: true.
    // If any error happens, it goes to next(error) so Express error middleware can handle it.
    return res.status(201).json({ conversation: newGroup, isNew: true });
  } catch (error) {
    next(error);
  }
};

// get user conversations;
export const getUserConversations = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    //     Gets the current logged-in user ID from the request (req.user.id).
    // This is usually set by an authentication middleware.
    const userId = req.user.id;

    // find all conversationGroups where the user is a participant
    //     Finds all conversation groups where this user is a participant.
    // Uses participantIds.has(userId) → Prisma filter to check if userId exists in the array.
    // Orders results by latest activity (updatedAt desc) → so the most recent conversation comes first.
    const conversations = await prisma.conversationGroup.findMany({
      where: {
        participantIds: {
          has: userId,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    //     Loops through each conversation group.
    // Promise.all ensures all async calls run in parallel and then return together.
    const responseData = await Promise.all(
      //       Finds the seller participant from the participant table for this conversation.
      // Condition: sellerId IS NOT NULL (since one participant is a user, the other is a seller).
      conversations.map(async (group) => {
        // get the sellerParticipant inside this conversation
        const sellerParticipant = await prisma.participant.findFirst({
          where: {
            conversationId: group.id,
            sellerId: { not: null },
          },
        });

        // get the seller full info
        // If a seller is found, fetch full seller info from sellers table.
        // Includes the seller’s shop details (name, avatar, etc.).
        let seller = null;
        if (sellerParticipant?.sellerId) {
          seller = await prisma.sellers.findUnique({
            where: {
              id: sellerParticipant.sellerId,
            },
            include: {
              shop: true,
            },
          });
        }

        // get the last message in the conversations, as we show that in the sidebar
        // Fetches the last message from this conversation (latest createdAt).
        // Used in chat sidebar to show the most recent message preview.
        const lastMessage = await prisma.message.findFirst({
          where: {
            conversationId: group.id,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        // check online status from redis
        //         Checks Redis for seller’s online presence.
        // Key format: online:seller:{sellerId}.
        // If Redis has a value → seller is online (true). Otherwise → offline (false).
        let isOnline = false;
        if (sellerParticipant?.sellerId) {
          const redisKey = `online:seller:${sellerParticipant.sellerId}`;
          const redisResult = await redis.get(redisKey);
          isOnline = !!redisResult;
        }
        // Calls a helper (getUnseenCount) to count how many unread messages this user has in this conversation.
        const unreadCount = await getUnseenCount("user", group.id);

        // Constructs a clean JSON object for the frontend:
        return {
          conversationId: group.id,
          seller: {
            id: seller?.id || null,
            name: seller?.shop?.name || "Unknown",
            isOnline,
            avatar: seller?.shop?.avatar,
          },
          lastMessage:
            lastMessage?.content || "Say something to start a conversation",
          lastMessagedAt: lastMessage?.createdAt || group.updatedAt,
          unreadCount,
        };
      })
    );

    return res.status(200).json({ conversations: responseData });
  } catch (error) {
    next(error);
  }
};

// get seller conversations
export const getSellerConversations = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const sellerId = req.seller.id;

    // find all conversationGroups where the user is a participant
    const conversations = await prisma.conversationGroup.findMany({
      where: {
        participantIds: {
          has: sellerId,
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    const responseData = await Promise.all(
      conversations.map(async (group) => {
        // get the sellerParticipant inside this conversation
        const userParticipant = await prisma.participant.findFirst({
          where: {
            conversationId: group.id,
            userId: { not: null },
          },
        });

        // get the user full info
        let user = null;
        if (userParticipant?.userId) {
          user = await prisma.users.findUnique({
            where: {
              id: userParticipant.userId,
            },
            include: {
              avatar: true,
            },
          });
        }

        // get the last message in the conversations, as we show that in the sidebar
        const lastMessage = await prisma.message.findFirst({
          where: {
            conversationId: group.id,
          },
          orderBy: {
            createdAt: "desc",
          },
        });

        // check online status from redis
        let isOnline = false;
        if (userParticipant?.userId) {
          const redisKey = `online:user:user_${userParticipant.userId}`;
          const redisResult = await redis.get(redisKey);
          isOnline = !!redisResult;
        }

        console.log("isonline", isOnline);

        const unreadCount = await getUnseenCount("seller", group.id);

        return {
          conversationId: group.id,
          user: {
            id: user?.id || null,
            name: user?.name || "Unknown",
            isOnline,
            avatar: user?.avatar || null,
          },
          lastMessage:
            lastMessage?.content || "Say something to start a conversation",
          lastMessagedAt: lastMessage?.createdAt || group.updatedAt,
          unreadCount,
        };
      })
    );

    return res.status(200).json({ conversations: responseData });
  } catch (error) {
    next(error);
  }
};

// fetch user messages
export const fetchMessages = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    // we can't fetch all the messages hence we are implementing pagination here
    // Get logged-in user’s ID.
    // Extract conversationId from route params.
    // Get page number from query string (?page=2). Defaults to 1.
    // pageSize = 10 → always fetch 10 messages per request.
    const userId = req.user.id;
    const { conversationId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = 10;

    if (!conversationId) {
      return next(new ValidationError("Converation ID is required"));
    }

    // check if user has access to this conversation
    //     Finds conversation by ID.
    // If not found → throw NotFoundError.
    // Ensures the current user is one of the participantIds.
    // If not → throw AuthError.
    const conversation = await prisma.conversationGroup.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return next(new NotFoundError("Conversation not found"));
    }

    const hasAccess = conversation.participantIds.includes(userId);
    if (!hasAccess) {
      return next(new AuthError("Access denied to this conversation "));
    }

    // clear unseen messages for this user as this user is watching the messages
    await clearUnseenCount("user", conversationId);

    // get seller participant
    //     Finds the seller participant in this conversation.
    // Then fetch seller details & shop info.
    // Also check Redis key online:seller:{sellerId} for online status.
    const sellerParticipant = await prisma.participant.findFirst({
      where: {
        conversationId,
        sellerId: { not: null },
      },
    });

    // fetch seller info
    let seller = null;
    let isOnline = false;

    if (sellerParticipant?.sellerId) {
      seller = await prisma.sellers.findUnique({
        where: { id: sellerParticipant.sellerId },
        include: {
          shop: true,
        },
      });

      const redisKey = `online:seller:${sellerParticipant?.sellerId}`;
      const redisResult = await redis.get(redisKey);
      isOnline = !!redisResult;
    }

    // fetch paginated messages (latest first )
    //     Returns latest first messages.
    // Uses pagination (skip + take).
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Sends messages, seller info, pagination data.
    // hasMore = true only if page is completely filled (means there might be more messages).
    return res.status(200).json({
      messages,
      seller: {
        id: seller?.id || null,
        name: seller?.shop?.name || "Unknown",
        avatart: seller?.shop?.avatar || null,
        isOnline,
      },
      currentPage: page,
      hasMore: messages.length === pageSize,
    });
  } catch (error) {
    return next(error);
  }
};

// fetch seller messages
// fetch user messages
export const fetchSellerMessages = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    // we can't fetch all the messages hence we are implementing pagination here
    const sellerId = req.seller.id;
    const { conversationId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = 10;

    if (!conversationId) {
      return next(new ValidationError("Converation ID is required"));
    }

    // check if user has access to this conversation
    const conversation = await prisma.conversationGroup.findUnique({
      where: { id: conversationId },
    });

    if (!conversation) {
      return next(new NotFoundError("Conversation not found"));
    }

    const hasAccess = conversation.participantIds.includes(sellerId);
    if (!hasAccess) {
      return next(new AuthError("Access denied to this conversation "));
    }

    // clear unseen messages for this user as this user is watching the messages
    await clearUnseenCount("seller", conversationId);

    // get user participant
    const userParticipant = await prisma.participant.findFirst({
      where: {
        conversationId,
        userId: { not: null },
      },
    });

    // fetch user info
    let user = null;
    let isOnline = false;

    if (userParticipant?.sellerId) {
      user = await prisma.sellers.findUnique({
        where: { id: userParticipant.sellerId },
        include: {
          shop: true,
        },
      });

      const redisKey = `online:user:user_${userParticipant?.userId}`;
      const redisResult = await redis.get(redisKey);
      isOnline = !!redisResult;
    }

    // fetch paginated messages (latest first )
    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return res.status(200).json({
      messages,
      user: {
        id: user?.id || null,
        name: user?.shop?.name || "Unknown",
        avatart: user?.shop?.avatar || null,
        isOnline,
      },
      currentPage: page,
      hasMore: messages.length === pageSize,
    });
  } catch (error) {
    return next(error);
  }
};
