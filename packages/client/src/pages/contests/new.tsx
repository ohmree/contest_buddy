import {createForm, Form} from '@felte/solid';
import type {Component} from 'solid-js';

declare module "solid-js" {
  namespace JSX {
    interface Directives {
      form: Form<any>["form"]
    }
  }
}

const New: Component = () => {
  const {form} = createForm({
    // ...
    onSubmit: (values) => console.log(values),
    // ...
  });
  return (
    <section class="max-w-4xl p-6 mx-auto mt-2 bg-white rounded-md shadow-md dark:bg-gray-800">
        <h2 class="text-lg font-semibold text-gray-700 capitalize dark:text-white">Create a new contest</h2>

        <form use:form={form}>
            <div class="flex flex-col gap-6 mt-4">
                <div>
                    <label class="text-gray-700 dark:text-gray-200" for="name">Contest name</label>
                    <input name="name" type="text" class="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-300 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring" />
                </div>

                <div>
                    <label class="text-gray-700 dark:text-gray-200" for="picturesOnly">Pictures only?</label>
                    <input name="picturesOnly" type="checkbox" class="block px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-300 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring" />
                </div>

                <div>
                    <label class="text-gray-700 dark:text-gray-200" for="maxSubmissions">Max submissions per user</label>
                    <input name="maxSubmissions" type="number" min="1" class="block w-full px-4 py-2 mt-2 text-gray-700 bg-white border border-gray-300 rounded-md dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none focus:ring" />
                </div>
            </div>

            <div class="flex justify-end mt-6">
                <input type="submit" value="Save" class="px-6 py-2 leading-5 text-white transition-colors duration-200 transform bg-gray-700 rounded-md hover:bg-gray-600 focus:outline-none focus:bg-gray-600" />
            </div>
        </form>
    </section>
  )
}
/*
    <form use:form={form}>
      <input type="text" name="name" />
      <input type="checkbox" name="picturesOnly" />
      <input type="number" min="1" name="maxSubmissions" />
      <input type="submit" value="Create contest" />
    </form>
*/
export default New;
