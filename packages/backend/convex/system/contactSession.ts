import { v } from "convex/values"
import { internalQuery } from "../_generated/server"

/* This function will be allowed to read from your Convex database. It will not be accessible from the client. */
export const getOne = internalQuery({
  args: {
    contactSessionId: v.id("contactSession"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.contactSessionId)
  },
})
