import { router } from "../_core/trpc";
import { learningRouter } from "./learningRouter";
import { materialsRouter } from "./materialsRouter";
import { organizationRouter } from "./organizationRouter";
import { operationsRouter } from "./operationsRouter";
import { commercialRouter } from "./commercialRouter";
import { planningRouter } from "./planningRouter";
import { pgrRouter } from "./pgrRouter";
import { supportRouter } from "./supportRouter";
import { workspaceRouter } from "./workspaceRouter";
import { psychosocialRouter } from "./psychosocialRouter";
import { cipaRouter } from "./cipaRouter";
import { riskRouter } from "./riskRouter";
import { accidentRouter } from "./accidentRouter";

export const portalRouter = router({
  ...workspaceRouter._def.record,
  ...pgrRouter._def.record,
  ...learningRouter._def.record,
  ...materialsRouter._def.record,
  ...organizationRouter._def.record,
  ...operationsRouter._def.record,
  ...commercialRouter._def.record,
  ...planningRouter._def.record,
  ...supportRouter._def.record,
  ...psychosocialRouter._def.record,
  ...cipaRouter._def.record,
  ...riskRouter._def.record,
  ...accidentRouter._def.record,
});
