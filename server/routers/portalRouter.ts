import { router } from "../_core/trpc";
import { learningRouter } from "./learningRouter";
import { materialsRouter } from "./materialsRouter";
import { organizationRouter } from "./organizationRouter";
import { pgrRouter } from "./pgrRouter";
import { supportRouter } from "./supportRouter";
import { workspaceRouter } from "./workspaceRouter";

export const portalRouter = router({
  ...workspaceRouter._def.record,
  ...pgrRouter._def.record,
  ...learningRouter._def.record,
  ...materialsRouter._def.record,
  ...organizationRouter._def.record,
  ...supportRouter._def.record,
});
