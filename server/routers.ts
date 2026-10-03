import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";

const defaultProgress = {
  foundation: 0,
  communication: 0,
  fire: 0,
  flood: 0,
  earthquake: 0,
  firstAid: 0,
  help: 0,
};

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  progress: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const saved = await db.getProgressByOpenId(ctx.user.openId);
      return saved ?? { progress: defaultProgress, xp: 0, streak: 0, dailyDone: false };
    }),
    save: protectedProcedure
      .input(z.object({
        progress: z.record(z.string(), z.number()),
        xp: z.number().int().min(0),
        streak: z.number().int().min(0),
        dailyDone: z.boolean(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.upsertProgress({
          openId: ctx.user.openId,
          progress: JSON.stringify(input.progress),
          xp: input.xp,
          streak: input.streak,
          dailyDone: input.dailyDone ? 1 : 0,
        });
        return { success: true } as const;
      }),
  }),
});

export type AppRouter = typeof appRouter;
