import { fail, superValidate } from "sveltekit-superforms";
import { zod } from "sveltekit-superforms/adapters";
  import { universityDegree } from "@cos720project/shared";
import type { PageServerLoad } from "../../../$types";
import type { Actions } from "@sveltejs/kit";

export const load = (async () => {
    return {form: await superValidate(zod(universityDegree))};
}) satisfies PageServerLoad;

export const actions: Actions = {
  default: async (event) => {
    const form = await superValidate(event, zod(universityDegree));
    if (!form.valid) {
      return fail(400, {
        form,
      });
    }
    return {
      form,
    };
  },
};