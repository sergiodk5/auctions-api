import * as emailVerificationSchema from "@/db/email-verification.schema";
import * as rolesPermissionsSchema from "@/db/roles-permissions.schema";
import * as tokensSchema from "@/db/tokens.schema";
import * as usersSchema from "@/db/users.schema";

export default {
    ...usersSchema,
    ...tokensSchema,
    ...emailVerificationSchema,
    ...rolesPermissionsSchema,
};
