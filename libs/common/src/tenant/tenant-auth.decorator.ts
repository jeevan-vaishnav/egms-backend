import { SetMetadata } from "@nestjs/common";
import { TENANT_REQUIRED_KEY } from "./tenant.guard";

export const TenantRequired = () => SetMetadata(TENANT_REQUIRED_KEY, true);
