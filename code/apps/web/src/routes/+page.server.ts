import type { PageServerLoad } from './$types';
import { zod } from "sveltekit-superforms/adapters";
import { loginFormSchema } from "$lib/components/ui/login-form/schema";
import { fail, superValidate } from "sveltekit-superforms";
import type { Actions } from '@sveltejs/kit';

export const load = (async () => {
    return {form: await superValidate(zod(loginFormSchema))};
}) satisfies PageServerLoad;

export const actions: Actions = {
  default: async (event) => {
    const form = await superValidate(event, zod(loginFormSchema));
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